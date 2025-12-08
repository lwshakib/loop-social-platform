import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import {
  postsTable,
  usersTable,
  likesTable,
  bookmarksTable,
  commentsTable,
} from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

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

    // Get the specific reel with user info
    const [reel] = await db
      .select({
        id: postsTable.id,
        userId: postsTable.userId,
        content: postsTable.content,
        url: postsTable.url,
        type: postsTable.type,
        createdAt: postsTable.createdAt,
        likesCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${likesTable}
          WHERE ${likesTable.postId} = ${postsTable.id}
        )`.as("likesCount"),
        commentsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${commentsTable}
          WHERE ${commentsTable.postId} = ${postsTable.id}
        )`.as("commentsCount"),
        user: {
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
        },
      })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
      .where(and(eq(postsTable.id, postId), eq(postsTable.type, "reel")))
      .limit(1);

    if (!reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 });
    }

    // Check if current user has liked/saved this reel
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const [likedReel] = await db
        .select()
        .from(likesTable)
        .where(
          and(
            eq(likesTable.userId, currentUserId),
            eq(likesTable.postId, postId)
          )
        )
        .limit(1);

      const [savedReel] = await db
        .select()
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, currentUserId),
            eq(bookmarksTable.postId, postId)
          )
        )
        .limit(1);

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
      likesCount: reel.likesCount || 0,
      commentsCount: reel.commentsCount || 0,
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
