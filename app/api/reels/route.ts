import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PostType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get("x-user") || "null");
    const currentUserId = user?.id;

    // Get all reels with user info
    const reels = await prisma.post.findMany({
      where: { type: PostType.VIDEO },
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
    });

    // Check if current user has liked/saved each reel
    let reelsWithStatus = reels.map((reel) => ({
      ...reel,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && reels.length > 0) {
      const reelIds = reels.map((r) => r.id);

      // Get liked reels
      const likedReels = await prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: reelIds },
        },
        select: { postId: true },
      });

      // Get saved reels
      const savedReels = await prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: { in: reelIds },
        },
        select: { postId: true },
      });

      const likedReelIds = new Set(likedReels.map((lr) => lr.postId));
      const savedReelIds = new Set(savedReels.map((sr) => sr.postId));

      reelsWithStatus = reels.map((reel) => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
        isSaved: savedReelIds.has(reel.id),
      }));
    }

    // Map to response format
    const response = reelsWithStatus.map((reel) => ({
      id: reel.id,
      userId: reel.userId,
      content: reel.content,
      imageUrl: reel.url,
      type: reel.type,
      likesCount: reel._count.likes || 0,
      commentsCount: reel._count.comments || 0,
      createdAt: reel.createdAt.toISOString(),
      isLiked: reel.isLiked,
      isSaved: reel.isSaved,
      user: reel.user,
    }));

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching reels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
