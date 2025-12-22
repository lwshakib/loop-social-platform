import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Get all comments with user info
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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
          user: {
            ...reply.user,
            imageUrl: reply.user.image,
          },
        }));

      return {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          ...comment.user,
          imageUrl: comment.user.image,
        },
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
    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get("x-user") || "null");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDbUser = user;

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

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
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    // Create comment
    const newComment = await prisma.comment.create({
      data: {
        userId: currentDbUser.id,
        postId: postId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: newComment.id,
        userId: newComment.userId,
        postId: newComment.postId,
        content: newComment.content,
        parentId: newComment.parentId,
        createdAt: newComment.createdAt.toISOString(),
        updatedAt: newComment.updatedAt.toISOString(),
        user: {
          ...newComment.user,
          imageUrl: newComment.user.image,
        },
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
