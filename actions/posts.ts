/**
 * Posts Server Actions
 * This file contains logic for retrieving and processing posts from the database.
 * These functions usually run on the server side (e.g., in Server Components or API routes).
 */

import prisma from '@/lib/prisma';
import { PostType } from '@/generated/prisma/client';

/**
 * getUserPosts
 * Retrieves a list of posts associated with a specific user, filtered by a designated type.
 * It also checks if the 'currentUserId' has liked or saved these posts to provide correct UI state.
 *
 * @param username The slug/handle of the profile being viewed.
 * @param type Filter criteria: 'posts' (images/text), 'reels' (video), 'liked' (user likes), 'saved' (user bookmarks).
 * @param currentUserId The ID of the authenticated user viewing the profile (optional).
 * @returns Array of formatted post objects with engagement metadata.
 */
export async function getUserPosts(
  username: string,
  type: 'posts' | 'reels' | 'liked' | 'saved',
  currentUserId?: string
) {
  // 1. Resolve the target user by their unique handle
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return [];
  }

  let posts;

  // 2. FILTERING LOGIC: Determine which posts to fetch based on the 'type' parameter
  if (type === 'posts') {
    // Normal feed items: Text or Image posts, excluding Video (Reels)
    posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        type: { in: [PostType.TEXT, PostType.IMAGE] },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else if (type === 'reels') {
    // Media items explicitly marked as VIDEO
    posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        type: PostType.VIDEO,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else if (type === 'liked' && currentUserId) {
    // Intersection: Posts that have a 'Like' record associated with the current user
    posts = await prisma.post.findMany({
      where: {
        likes: {
          some: { userId: currentUserId },
        },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else if (type === 'saved' && currentUserId) {
    // Intersection: Posts that have a 'Bookmark' record associated with the current user
    posts = await prisma.post.findMany({
      where: {
        bookmarks: {
          some: { userId: currentUserId },
        },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // If 'liked' or 'saved' is requested WITHOUT a current user session, we can't show private data
    return [];
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  // 3. ENHANCEMENT: Enrich posts with 'isLiked' and 'isSaved' booleans for the current viewer
  if (currentUserId) {
    const postIds = posts.map((p) => p.id);

    // Identify which of the fetched posts are liked by the viewer
    const likedPosts = await prisma.like.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    // Identify which of the fetched posts are bookmarked by the viewer
    const savedPosts = await prisma.bookmark.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    // Convert to Sets for O(1) lookup during formatting
    const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
    const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

    return posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      url: post.url,
      type: post.type,
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    }));
  }

  // Fallback for unauthenticated viewers
  return posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    content: post.content,
    url: post.url,
    type: post.type,
    createdAt: post.createdAt,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLiked: false,
    isSaved: false,
  }));
}
