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
import { eq, sql, desc, and, gt, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const afterPostId = searchParams.get("afterPostId");
    const limit = parseInt(searchParams.get("limit") || "5");
    const excludeIds =
      searchParams.get("excludeIds")?.split(",").filter(Boolean) || [];

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

    // Build query for recommended reels
    // Exclude already-loaded videos to implement circular behavior
    const excludeConditions =
      excludeIds.length > 0
        ? and(
            eq(postsTable.type, "reel"),
            sql`${postsTable.id} NOT IN (${sql.join(
              excludeIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        : eq(postsTable.type, "reel");

    let reels = await db
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
      .where(excludeConditions)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);

    // If we got fewer videos than requested and there are excluded IDs,
    // it means we've shown all videos - loop back to the beginning
    if (reels.length < limit && excludeIds.length > 0) {
      const remainingNeeded = limit - reels.length;
      const recycledReels = await db
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
        .orderBy(desc(postsTable.createdAt))
        .limit(remainingNeeded);

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
      const likedReels = await db
        .select({ postId: likesTable.postId })
        .from(likesTable)
        .where(
          and(
            eq(likesTable.userId, currentUserId),
            inArray(likesTable.postId, reelIds)
          )
        );

      // Get saved reels
      const savedReels = await db
        .select({ postId: bookmarksTable.postId })
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, currentUserId),
            inArray(bookmarksTable.postId, reelIds)
          )
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
    console.error("Error fetching recommended reels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
