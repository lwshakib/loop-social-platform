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

    if (!currentUserId) {
      return NextResponse.json({ data: [] });
    }

    // Get list of user IDs that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map((f: any) => f.followingId);
    followingIds.push(currentUserId); // Include own stories

    // Get active stories (not expired) from followed users
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: new Date() },
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Group stories by user
    const storiesByUser = new Map<
      string,
      {
        userId: string;
        user: {
          id: string;
          username: string;
          name: string;
          imageUrl: string | null;
        };
        stories: Array<{
          id: string;
          userId: string;
          caption: string | null;
          url: string;
          createdAt: string;
          expiresAt: string;
        }>;
      }
    >();

    stories.forEach((story: any) => {
      if (!storiesByUser.has(story.userId)) {
        storiesByUser.set(story.userId, {
          userId: story.userId,
          user: {
            id: story.user.id,
            username: story.user.username,
            name: story.user.name,
            imageUrl: story.user.image,
          },
          stories: [],
        });
      }
      storiesByUser.get(story.userId)!.stories.push({
        id: story.id,
        userId: story.userId,
        caption: story.caption,
        url: story.url,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      });
    });

    const response = Array.from(storiesByUser.values());

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // currentDbUser is already user from session in Better Auth
    const currentDbUser = user;

    const body = await request.json();
    const { caption, url } = body;

    // Validate
    if (!url && !caption) {
      return NextResponse.json(
        { error: "Story must have either caption or url" },
        { status: 400 }
      );
    }

    // Create story with 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStory = await prisma.story.create({
      data: {
        userId: currentDbUser.id,
        caption: caption || null,
        url: url || "",
        expiresAt,
      },
    });

    return NextResponse.json({
      data: {
        id: newStory.id,
        userId: newStory.userId,
        caption: newStory.caption,
        url: newStory.url,
        createdAt: newStory.createdAt.toISOString(),
        expiresAt: newStory.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
