import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { storiesTable, usersTable, followsTable } from "@/db/schema";
import { eq, sql, desc, and, inArray, gt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const currentUserData = await currentUser();
    let currentUserId: string | undefined;

    if (currentUserData) {
      const [currentDbUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, currentUserData.id))
        .limit(1);

      if (currentDbUser) {
        currentUserId = currentDbUser.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ data: [] });
    }

    // Get list of user IDs that the current user follows
    const following = await db
      .select({ followedUserId: followsTable.followedUserId })
      .from(followsTable)
      .where(eq(followsTable.followingUserId, currentUserId));

    const followingIds = following.map((f) => f.followedUserId);
    followingIds.push(currentUserId); // Include own stories

    // Get active stories (not expired) from followed users
    const stories = await db
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
          inArray(storiesTable.userId, followingIds),
          gt(storiesTable.expiresAt, sql`now()`)
        )
      )
      .orderBy(desc(storiesTable.createdAt));

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
          caption: string;
          url: string;
          createdAt: string;
          expiresAt: string;
        }>;
      }
    >();

    stories.forEach((story) => {
      if (!storiesByUser.has(story.userId)) {
        storiesByUser.set(story.userId, {
          userId: story.userId,
          user: story.user,
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
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's database record
    const [currentDbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, user.id))
      .limit(1);

    if (!currentDbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { caption, url, type } = body;

    // Validate
    if (!url && !caption) {
      return NextResponse.json(
        { error: "Story must have either caption or url" },
        { status: 400 }
      );
    }

    // Create story
    const [newStory] = await db
      .insert(storiesTable)
      .values({
        userId: currentDbUser.id,
        caption: caption || "",
        url: url || "",
      })
      .returning();

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
