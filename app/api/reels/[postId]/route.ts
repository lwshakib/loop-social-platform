import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { PostType } from "@/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

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

    // Get the specific reel with user info
    const reel = await prisma.post.findFirst({
      where: {
        id: postId,
        type: PostType.VIDEO,
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
    });

    if (!reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 });
    }

    // Check if current user has liked/saved this reel
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const likedReel = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: postId,
          },
        },
      });

      const savedReel = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: postId,
          },
        },
      });

      isLiked = !!likedReel;
      isSaved = !!savedReel;
    }

    // Map to response format
    const response = {
      id: reel.id,
      userId: reel.userId,
      content: reel.content,
      imageUrl: reel.url,
      type: reel.type,
      likesCount: reel._count.likes || 0,
      commentsCount: reel._count.comments || 0,
      createdAt: reel.createdAt.toISOString(),
      isLiked,
      isSaved,
      user: reel.user,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching reel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
