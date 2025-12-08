import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import {
  postsTable,
  usersTable,
  likesTable,
  bookmarksTable,
  commentsTable,
  followsTable,
} from "@/db/schema";
import { eq, sql, desc, and, inArray, ne, notInArray } from "drizzle-orm";

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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get trending posts (ordered by likes count and recency, excluding reels)
    const trendingPosts = await db
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
          isVerified: usersTable.isVerified,
        },
      })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
      .where(sql`${postsTable.type} != 'reel'`)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit * 2); // Get more to filter by engagement

    // Sort by engagement (likes + comments) and recency
    const postsWithEngagement = trendingPosts
      .map((post) => ({
        ...post,
        engagement: (post.likesCount || 0) + (post.commentsCount || 0),
      }))
      .sort((a, b) => {
        // First sort by engagement, then by recency
        if (b.engagement !== a.engagement) {
          return b.engagement - a.engagement;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, limit);

    // Check if current user has liked/saved each post
    let postsWithStatus = postsWithEngagement.map((post) => ({
      ...post,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && postsWithStatus.length > 0) {
      const postIds = postsWithStatus.map((p) => p.id);

      // Get liked posts
      const likedPosts = await db
        .select({ postId: likesTable.postId })
        .from(likesTable)
        .where(
          and(
            eq(likesTable.userId, currentUserId),
            inArray(likesTable.postId, postIds)
          )
        );

      // Get saved posts
      const savedPosts = await db
        .select({ postId: bookmarksTable.postId })
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, currentUserId),
            inArray(bookmarksTable.postId, postIds)
          )
        );

      const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
      const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

      postsWithStatus = postsWithStatus.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }

    // Get suggested users (users not followed by current user)
    let suggestedUsers: any[] = [];

    if (currentUserId) {
      // Get list of user IDs that the current user follows
      const following = await db
        .select({ followedUserId: followsTable.followedUserId })
        .from(followsTable)
        .where(eq(followsTable.followingUserId, currentUserId));

      const followingIds = following.map((f) => f.followedUserId);
      followingIds.push(currentUserId); // Exclude self

      // Get suggested users (not following, not self)
      suggestedUsers = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
          bio: usersTable.bio,
          isVerified: usersTable.isVerified,
        })
        .from(usersTable)
        .where(
          and(
            ne(usersTable.id, currentUserId),
            followingIds.length > 0
              ? notInArray(usersTable.id, followingIds)
              : sql`1=1`
          )
        )
        .limit(10);
    } else {
      // If not logged in, show random users
      suggestedUsers = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
          bio: usersTable.bio,
          isVerified: usersTable.isVerified,
        })
        .from(usersTable)
        .limit(10);
    }

    // Transform to response format
    const response = {
      posts: postsWithStatus.map((post) => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.url,
        type: post.type,
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        createdAt: post.createdAt.toISOString(),
        isLiked: post.isLiked || false,
        isSaved: post.isSaved || false,
        user: post.user,
      })),
      suggestedUsers: suggestedUsers.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        imageUrl: user.imageUrl,
        bio: user.bio,
        isVerified: user.isVerified,
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
