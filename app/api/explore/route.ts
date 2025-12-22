import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { PostType } from "../../../../generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserData = session?.user;
    let currentUserId: string | undefined;

    if (currentUserData) {
      currentUserId = currentUserData.id;
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get trending posts (ordered by likes count and recency, excluding reels)
    const trendingPosts = await prisma.post.findMany({
      where: {
        type: { not: PostType.VIDEO },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit * 2, // Get more to filter by engagement
    });

    // Sort by engagement (likes + comments) and recency
    const postsWithEngagement = trendingPosts
      .map((post) => ({
        ...post,
        engagement: (post._count.likes || 0) + (post._count.comments || 0),
      }))
      .sort((a, b) => {
        // First sort by engagement, then by recency
        if (b.engagement !== a.engagement) {
          return b.engagement - a.engagement;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, limit);

    // Check if current user has liked/saved each post
    let postsWithStatus = postsWithEngagement.map((post) => ({
      ...post,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && postsWithStatus.length > 0) {
      const postIds = postsWithStatus.map((p) => p.id);

      // Get liked posts
      const likedPosts = await prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });

      // Get saved posts
      const savedPosts = await prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });

      const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
      const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

      postsWithStatus = postsWithStatus.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }

    // Get suggested users (users not followed by current user)
    let suggestedUsers: any[] = [];

    if (currentUserId) {
      // Get list of user IDs that the current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);
      followingIds.push(currentUserId); // Exclude self

      // Get suggested users (not following, not self)
      suggestedUsers = await prisma.user.findMany({
        where: {
          id: { notIn: followingIds },
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          bio: true,
        },
        take: 10,
      });
    } else {
      // If not logged in, show random users
      suggestedUsers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          bio: true,
        },
        take: 10,
      });
    }

    // Transform to response format
    const response = {
      posts: postsWithStatus.map((post) => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.url,
        type: post.type,
        likesCount: post._count.likes || 0,
        commentsCount: post._count.comments || 0,
        createdAt: post.createdAt.toISOString(),
        isLiked: post.isLiked || false,
        isSaved: post.isSaved || false,
        user: {
          ...post.user,
          imageUrl: post.user.image,
        },
      })),
      suggestedUsers: suggestedUsers.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        imageUrl: user.image,
        bio: user.bio,
        isVerified: false,
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
