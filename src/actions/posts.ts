import db from "@/db";
import {
  postsTable,
  usersTable,
  likesTable,
  bookmarksTable,
  commentsTable,
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

type PostType = "text" | "image" | "reel";

export async function getUserPosts(
  username: string,
  type: "posts" | "reels" | "liked" | "saved",
  currentUserId?: string
) {
  // First get the user by username
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    return [];
  }

  let posts;

  // Filter based on type
  if (type === "posts") {
    // Regular posts (text or image, not reels)
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
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.userId, user.id),
          sql`${postsTable.type} IN ('text', 'image')`
        )
      )
      .orderBy(desc(postsTable.createdAt));
  } else if (type === "reels") {
    // Only reels
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
      })
      .from(postsTable)
      .where(and(eq(postsTable.userId, user.id), eq(postsTable.type, "reel")))
      .orderBy(desc(postsTable.createdAt));
  } else if (type === "liked" && currentUserId) {
    // Posts liked by current user
    const [currentDbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUserId))
      .limit(1);

    if (!currentDbUser) {
      return [];
    }

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
      })
      .from(postsTable)
      .innerJoin(likesTable, eq(likesTable.postId, postsTable.id))
      .where(eq(likesTable.userId, currentDbUser.id))
      .orderBy(desc(postsTable.createdAt));
  } else if (type === "saved" && currentUserId) {
    // Posts saved by current user
    const [currentDbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUserId))
      .limit(1);

    if (!currentDbUser) {
      return [];
    }

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
      })
      .from(postsTable)
      .innerJoin(bookmarksTable, eq(bookmarksTable.postId, postsTable.id))
      .where(eq(bookmarksTable.userId, currentDbUser.id))
      .orderBy(desc(postsTable.createdAt));
  } else {
    // Default to empty for liked/saved if no current user
    return [];
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  const postIds = posts.map((p) => p.id);

  // Aggregate fresh counts to avoid any alias/coercion issues
  const likeCounts =
    postIds.length > 0
      ? await db
          .select({
            postId: likesTable.postId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(likesTable)
          .where(inArray(likesTable.postId, postIds))
          .groupBy(likesTable.postId)
      : [];

  const commentCounts =
    postIds.length > 0
      ? await db
          .select({
            postId: commentsTable.postId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(commentsTable)
          .where(inArray(commentsTable.postId, postIds))
          .groupBy(commentsTable.postId)
      : [];

  const likeCountMap = new Map<string, number>(
    likeCounts.map((row) => [row.postId, Number(row.count ?? 0)])
  );
  const commentCountMap = new Map<string, number>(
    commentCounts.map((row) => [row.postId, Number(row.count ?? 0)])
  );

  // Check if current user has liked/saved each post
  if (currentUserId) {
    const [currentDbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUserId))
      .limit(1);

    if (currentDbUser) {
      const postIds = posts.map((p) => p.id);

      // Get liked posts
      const likedPosts =
        postIds.length > 0
          ? await db
              .select({ postId: likesTable.postId })
              .from(likesTable)
              .where(
                and(
                  eq(likesTable.userId, currentDbUser.id),
                  inArray(likesTable.postId, postIds)
                )
              )
          : [];

      // Get saved posts
      const savedPosts =
        postIds.length > 0
          ? await db
              .select({ postId: bookmarksTable.postId })
              .from(bookmarksTable)
              .where(
                and(
                  eq(bookmarksTable.userId, currentDbUser.id),
                  inArray(bookmarksTable.postId, postIds)
                )
              )
          : [];

      const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
      const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

      return posts.map((post) => ({
        ...post,
        likesCount: likeCountMap.get(post.id) ?? 0,
        commentsCount: commentCountMap.get(post.id) ?? 0,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }
  }

  return posts.map((post) => ({
    ...post,
    likesCount: likeCountMap.get(post.id) ?? 0,
    commentsCount: commentCountMap.get(post.id) ?? 0,
    isLiked: false,
    isSaved: false,
  }));
}
