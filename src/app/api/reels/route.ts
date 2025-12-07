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
import { eq, sql, desc, inArray } from "drizzle-orm";

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

    // Get all reels with user info
    const reels = await db
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
      .where(eq(postsTable.type, "reel"))
      .orderBy(desc(postsTable.createdAt));

    // Check if current user has liked/saved each reel
    let reelsWithStatus = reels.map((reel) => ({
      ...reel,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && reels.length > 0) {
      const reelIds = reels.map((r) => r.id);

      // Get liked reels
      const likedReels = await db
        .select({ postId: likesTable.postId })
        .from(likesTable)
        .where(
          eq(likesTable.userId, currentUserId) &&
            inArray(likesTable.postId, reelIds)
        );

      // Get saved reels
      const savedReels = await db
        .select({ postId: bookmarksTable.postId })
        .from(bookmarksTable)
        .where(
          eq(bookmarksTable.userId, currentUserId) &&
            inArray(bookmarksTable.postId, reelIds)
        );

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
      likesCount: reel.likesCount || 0,
      commentsCount: reel.commentsCount || 0,
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
