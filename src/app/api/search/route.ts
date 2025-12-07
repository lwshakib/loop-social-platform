import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import {
  usersTable,
  postsTable,
  likesTable,
  bookmarksTable,
  commentsTable,
} from "@/db/schema";
import { eq, sql, desc, ilike, or, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, users, posts

    if (!query.trim()) {
      return NextResponse.json({
        data: {
          users: [],
          posts: [],
        },
      });
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

    const searchTerm = `%${query.trim()}%`;

    // Search users
    let users: any[] = [];
    if (type === "all" || type === "users") {
      users = await db
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
          or(
            ilike(usersTable.username, searchTerm),
            ilike(usersTable.name, searchTerm)
          )
        )
        .limit(10);
    }

    // Search posts
    let posts: any[] = [];
    if (type === "all" || type === "posts") {
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
        .where(ilike(postsTable.content, searchTerm))
        .orderBy(desc(postsTable.createdAt))
        .limit(20);

      // Check if current user has liked/saved each post
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

        posts = posts.map((post) => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
          isSaved: savedPostIds.has(post.id),
        }));
      } else {
        posts = posts.map((post) => ({
          ...post,
          isLiked: false,
          isSaved: false,
        }));
      }
    }

    // Transform response
    const response = {
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        imageUrl: user.imageUrl,
        bio: user.bio,
        isVerified: user.isVerified,
      })),
      posts: posts.map((post) => ({
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
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

