import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get current authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserData = session?.user;
    let currentUserId: string | undefined;

    if (currentUserData) {
      currentUserId = currentUserData.id;
    }

    // Get post with user info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
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
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if current user has liked/saved this post
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: postId,
          },
        },
      });

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: postId,
          },
        },
      });

      isLiked = !!like;
      isSaved = !!bookmark;
    }

    return NextResponse.json({
      data: {
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.url,
        type: post.type,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        createdAt: post.createdAt.toISOString(),
        isLiked,
        isSaved,
        user: {
          ...post.user,
          imageUrl: post.user.image,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
