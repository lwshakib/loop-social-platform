import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

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
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get posts from users that the current user follows, or all posts if not logged in
    let posts;

    if (currentUserId) {
      // Get list of user IDs that the current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);
      followingIds.push(currentUserId); // Include own posts

      // Get posts from followed users
      posts = await prisma.post.findMany({
        where: {
          userId: { in: followingIds },
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
        take: limit,
      });
    } else {
      // If not logged in, show all posts (including all types: text, image, reel)
      posts = await prisma.post.findMany({
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
        take: limit,
      });
    }

    // Check if current user has liked/saved each post
    let postsWithStatus = posts.map((post) => ({
      ...post,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);

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

      postsWithStatus = posts.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }

    // Transform to response format
    const response = postsWithStatus.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.url,
      type: post.type,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
      isLiked: post.isLiked || false,
      isSaved: post.isSaved || false,
      user: {
        ...post.user,
        imageUrl: post.user.image,
      },
    }));

    return NextResponse.json({ data: { posts: response } });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
