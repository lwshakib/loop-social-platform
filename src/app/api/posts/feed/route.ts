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
import { eq, sql, desc, and, inArray } from "drizzle-orm";

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
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get posts from users that the current user follows, or all posts if not logged in
    let posts;

    if (currentUserId) {
      // Get list of user IDs that the current user follows
      const following = await db
        .select({ followingId: followsTable.followingId })
        .from(followsTable)
        .where(eq(followsTable.followerId, currentUserId));

      const followingIds = following.map((f) => f.followingId);
      followingIds.push(currentUserId); // Include own posts

      // Get posts from followed users
      posts = await db
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
        .where(
          and(
            inArray(postsTable.userId, followingIds),
            sql`${postsTable.type} != 'reel'` // Exclude reels from feed
          )
        )
        .orderBy(desc(postsTable.createdAt))
        .limit(limit);
    } else {
      // If not logged in, show all posts (excluding reels)
      posts = await db
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
        .where(sql`${postsTable.type} != 'reel'`)
        .orderBy(desc(postsTable.createdAt))
        .limit(limit);
    }

    // Check if current user has liked/saved each post
    let postsWithStatus = posts.map((post) => ({
      ...post,
      isLiked: false,
      isSaved: false,
    }));

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);

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

      postsWithStatus = posts.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }

    // Transform to response format
    const response = postsWithStatus.map((post) => ({
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
    }));

    return NextResponse.json({ data: { posts: response } });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

