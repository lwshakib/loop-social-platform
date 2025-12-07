import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { commentsTable, usersTable, postsTable } from "@/db/schema";
import { eq, desc, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get all top-level comments (no parentId) with user info
    const comments = await db
      .select({
        id: commentsTable.id,
        userId: commentsTable.userId,
        postId: commentsTable.postId,
        content: commentsTable.content,
        parentId: commentsTable.parentId,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
        },
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt));

    // Separate top-level comments and replies
    const topLevelComments = comments.filter((c) => !c.parentId);
    const replies = comments.filter((c) => c.parentId);

    // Build comment tree
    const commentsWithReplies = topLevelComments.map((comment) => {
      const commentReplies = replies
        .filter((reply) => reply.parentId === comment.id)
        .map((reply) => ({
          id: reply.id,
          userId: reply.userId,
          postId: reply.postId,
          content: reply.content,
          parentId: reply.parentId,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          user: reply.user,
        }));

      return {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
        replies: commentReplies,
      };
    });

    return NextResponse.json({ data: commentsWithReplies });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
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

    // Check if post exists
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it exists and belongs to the same post
    if (parentId) {
      const [parentComment] = await db
        .select()
        .from(commentsTable)
        .where(eq(commentsTable.id, parentId))
        .limit(1);

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    // Create comment
    const [newComment] = await db
      .insert(commentsTable)
      .values({
        userId: currentDbUser.id,
        postId: postId,
        content: content.trim(),
        parentId: parentId || null,
      })
      .returning();

    // Fetch the comment with user info
    const [commentWithUser] = await db
      .select({
        id: commentsTable.id,
        userId: commentsTable.userId,
        postId: commentsTable.postId,
        content: commentsTable.content,
        parentId: commentsTable.parentId,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
        },
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.id, newComment.id))
      .limit(1);

    return NextResponse.json({
      data: {
        id: commentWithUser.id,
        userId: commentWithUser.userId,
        postId: commentWithUser.postId,
        content: commentWithUser.content,
        parentId: commentWithUser.parentId,
        createdAt: commentWithUser.createdAt.toISOString(),
        updatedAt: commentWithUser.updatedAt.toISOString(),
        user: commentWithUser.user,
        replies: [],
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
