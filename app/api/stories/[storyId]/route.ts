import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> | { storyId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const storyId = resolvedParams.storyId;

    // Get story with user info
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found or expired" },
        { status: 404 }
      );
    }

    // Get all active stories from the same user
    const allUserStories = await prisma.story.findMany({
      where: {
        userId: story.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
    });

    const response = {
      story: {
        id: story.id,
        userId: story.userId,
        url: story.url,
        caption: story.caption,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
        user: story.user,
      },
      allStories: allUserStories.map((s) => ({
        id: s.id,
        userId: s.userId,
        url: s.url,
        caption: s.caption,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
