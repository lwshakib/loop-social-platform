import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostType } from '@/generated/prisma/enums';
import { getSignedUrlIfNeeded } from '@/lib/s3';
import { getEmbedding, cosineSimilarity } from '@/lib/embeddings';
import { querySimilarVideos } from '@/lib/pinecone';

const DIMENSIONS = 768;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || [];

    // Get current authenticated user from x-user header (set by proxy middleware)
    const userJson = request.headers.get('x-user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const currentUserId = currentUser?.id;

    let preferenceVector = new Array<number>(DIMENSIONS).fill(0);
    let hasInteractions = false;

    // 1. Build User Preference Vector if user is authenticated
    if (currentUserId) {
      // Get likes, bookmarks, and watch events
      const [likes, bookmarks, watchEvents] = await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId },
          include: { post: { select: { embeddingJson: true } } },
        }),
        prisma.bookmark.findMany({
          where: { userId: currentUserId },
          include: { post: { select: { embeddingJson: true } } },
        }),
        prisma.watchEvent.findMany({
          where: { userId: currentUserId },
          include: { post: { select: { embeddingJson: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50, // evaluate last 50 watch events
        }),
      ]);

      // Helper to parse embedding and add to preference vector with a weight
      const addWeight = (embeddingJson: string | null, weight: number) => {
        if (!embeddingJson) return;
        try {
          const vector = JSON.parse(embeddingJson);
          if (Array.isArray(vector) && vector.length === DIMENSIONS) {
            hasInteractions = true;
            for (let i = 0; i < DIMENSIONS; i++) {
              preferenceVector[i] += vector[i] * weight;
            }
          }
        } catch (_) {}
      };

      // Apply weights to interactions:
      // Liked videos indicate positive interest
      likes.forEach((like) => addWeight(like.post.embeddingJson, 2.0));

      // Bookmarked videos indicate strong positive interest
      bookmarks.forEach((bookmark) => addWeight(bookmark.post.embeddingJson, 3.0));

      // Watch events: completed indicates high interest, very short watch time (<3s) indicates skip (negative)
      watchEvents.forEach((event) => {
        if (event.completed) {
          addWeight(event.post.embeddingJson, 4.0);
        } else if (event.duration < 3) {
          addWeight(event.post.embeddingJson, -1.5); // Negative weight for skipped content
        } else {
          addWeight(event.post.embeddingJson, 1.0);
        }
      });

      // Normalize preference vector if there were interactions
      if (hasInteractions) {
        let norm = 0;
        for (let i = 0; i < DIMENSIONS; i++) {
          norm += preferenceVector[i] * preferenceVector[i];
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
          for (let i = 0; i < DIMENSIONS; i++) {
            preferenceVector[i] = preferenceVector[i] / norm;
          }
        }
      }
    }

    // If no interactions (or cold start), create a default balanced preference vector
    if (!hasInteractions) {
      preferenceVector = new Array<number>(DIMENSIONS).fill(0);
      preferenceVector[0] = 1.0; // unit vector default
    }

    let recommendedIds: string[] | null = null;

    // 2. Candidate Generation (Stage 1)
    // If Pinecone is configured, query Pinecone for candidate IDs
    if (process.env.PINECONE_API_KEY) {
      recommendedIds = await querySimilarVideos(preferenceVector, limit * 2, excludeIds);
    }

    let reels: any[] = [];

    if (recommendedIds && recommendedIds.length > 0) {
      // Resolve video objects from database based on Pinecone recommendations
      const posts = await prisma.post.findMany({
        where: {
          id: { in: recommendedIds },
          type: PostType.VIDEO,
        },
        include: {
          user: {
            select: { id: true, username: true, name: true, image: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });

      // Maintain Pinecone's ranked order
      const postMap = new Map(posts.map((p) => [p.id, p]));
      reels = recommendedIds.map((id) => postMap.get(id)).filter(Boolean) as any[];
    } else {
      // Fallback: Fetch candidates directly from database and rank locally
      const posts = await prisma.post.findMany({
        where: {
          type: PostType.VIDEO,
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        },
        include: {
          user: {
            select: { id: true, username: true, name: true, image: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });

      // Rank candidates locally using Cosine Similarity (Stage 2)
      const scoredPosts = await Promise.all(
        posts.map(async (post) => {
          let videoVector: number[] = [];
          try {
            videoVector = post.embeddingJson ? JSON.parse(post.embeddingJson) : [];
          } catch (_) {}

          // Generate embedding on the fly if missing in database
          if (!Array.isArray(videoVector) || videoVector.length !== DIMENSIONS) {
            videoVector = await getEmbedding(post.content, {
              category: 'general',
              authorId: post.userId,
            });
            // Async save generated embedding to DB for future speedups
            prisma.post
              .update({
                where: { id: post.id },
                data: { embeddingJson: JSON.stringify(videoVector) },
              })
              .catch(console.error);
          }

          const similarity = cosineSimilarity(preferenceVector, videoVector);

          // Add a minor popularity/engagement boost factor
          const engagement = (post._count.likes || 0) + (post._count.comments || 0);
          const popularityBoost = 1.0 + 0.1 * Math.log1p(engagement);
          const score = similarity * popularityBoost;

          return { post, score };
        })
      );

      // Sort by recommendation score descending
      scoredPosts.sort((a, b) => b.score - a.score);
      reels = scoredPosts.map((item) => item.post);
    }

    // 3. Diversification / Exploration & Circular Fallbacks (Stage 3)
    // Inject 10% random exploration reels to avoid content bubbles
    if (reels.length > 2) {
      for (let i = 0; i < reels.length; i++) {
        if (Math.random() < 0.1 && i < reels.length - 1) {
          // Swap with a random element downstream to mix the feed
          const swapIdx = i + 1 + Math.floor(Math.random() * (reels.length - i - 1));
          const temp = reels[i];
          reels[i] = reels[swapIdx];
          reels[swapIdx] = temp;
        }
      }
    }

    // If we have fewer than limit, loop back to beginning
    if (reels.length < limit) {
      const remainingNeeded = limit - reels.length;
      const recycledReels = await prisma.post.findMany({
        where: { type: PostType.VIDEO },
        include: {
          user: {
            select: { id: true, username: true, name: true, image: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: remainingNeeded,
      });

      reels = [...reels, ...recycledReels];
    }

    // Slice to the requested limit
    reels = reels.slice(0, limit);

    // 4. Resolve user statuses and sign media URLs
    let reelsWithStatus = reels.map((reel) => ({
      ...reel,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && reels.length > 0) {
      const reelIds = reels.map((r) => r.id);
      const [likedReels, savedReels] = await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: reelIds } },
          select: { postId: true },
        }),
        prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: reelIds } },
          select: { postId: true },
        }),
      ]);

      const likedReelIds = new Set(likedReels.map((lp) => lp.postId));
      const savedReelIds = new Set(savedReels.map((sp) => sp.postId));

      reelsWithStatus = reels.map((reel) => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
        isSaved: savedReelIds.has(reel.id),
      }));
    }

    // Map to API response format with signed S3 URLs
    const response = await Promise.all(
      reelsWithStatus.map(async (reel) => ({
        id: reel.id,
        userId: reel.userId,
        content: reel.content,
        imageUrl: await getSignedUrlIfNeeded(reel.url),
        type: 'reel',
        likesCount: reel._count.likes || 0,
        commentsCount: reel._count.comments || 0,
        createdAt: reel.createdAt.toISOString(),
        isLiked: reel.isLiked,
        isSaved: reel.isSaved,
        user: {
          ...reel.user,
          imageUrl: await getSignedUrlIfNeeded(reel.user.image),
        },
      }))
    );

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching recommended reels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
