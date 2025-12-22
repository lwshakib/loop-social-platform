import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { PostType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "5");
    const excludeIds =
      searchParams.get("excludeIds")?.split(",").filter(Boolean) || [];

    // Get current authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserData = session?.user;
    let currentUserId: string | undefined;

    if (currentUserData) {
      currentUserId = currentUserData.id;
    }

    // Build query for recommended reels
    // Exclude already-loaded videos to implement circular behavior
    let reels = await prisma.post.findMany({
      where: {
        type: PostType.VIDEO,
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
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

    // If we got fewer videos than requested and there are excluded IDs,
    // it means we've shown all videos - loop back to the beginning
    if (reels.length < limit && excludeIds.length > 0) {
      const remainingNeeded = limit - reels.length;
      const recycledReels = await prisma.post.findMany({
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
        take: remainingNeeded,
      });

      reels = [...reels, ...recycledReels];
    }

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

      const likedReelIds = new Set(likedReels.map((lp) => lp.postId));
      const savedReelIds = new Set(savedReels.map((sp) => sp.postId));

      reelsWithStatus = reels.map((reel: any) => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
        isSaved: savedReelIds.has(reel.id),
      }));
    }

    // Map to response format
    const response = reelsWithStatus.map((reel: any) => ({
      id: reel.id,
      userId: reel.userId,
      content: reel.content,
      imageUrl: reel.url,
      type: reel.type,
      likesCount: reel._count.likes || 0,
      commentsCount: reel._count.comments || 0,
      createdAt: reel.createdAt.toISOString(),
      isLiked: reel.isLiked || false,
      isSaved: reel.isSaved || false,
      user: {
        ...reel.user,
        imageUrl: reel.user.image,
      },
    }));

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching recommended reels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
