import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { storiesTable, usersTable } from "@/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> | { storyId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const storyId = resolvedParams.storyId;

    // Get story with user info
    const [story] = await db
      .select({
        id: storiesTable.id,
        userId: storiesTable.userId,
        url: storiesTable.url,
        caption: storiesTable.caption,
        createdAt: storiesTable.createdAt,
        expiresAt: storiesTable.expiresAt,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
        },
      })
      .from(storiesTable)
      .innerJoin(usersTable, eq(storiesTable.userId, usersTable.id))
      .where(
        and(
          eq(storiesTable.id, storyId),
          gt(storiesTable.expiresAt, sql`now()`)
        )
      )
      .limit(1);

    if (!story) {
      return NextResponse.json(
        { error: "Story not found or expired" },
        { status: 404 }
      );
    }

    // Get all active stories from the same user
    const allUserStories = await db
      .select({
        id: storiesTable.id,
        userId: storiesTable.userId,
        url: storiesTable.url,
        caption: storiesTable.caption,
        createdAt: storiesTable.createdAt,
        expiresAt: storiesTable.expiresAt,
      })
      .from(storiesTable)
      .where(
        and(
          eq(storiesTable.userId, story.userId),
          gt(storiesTable.expiresAt, sql`now()`)
        )
      )
      .orderBy(storiesTable.createdAt);

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
