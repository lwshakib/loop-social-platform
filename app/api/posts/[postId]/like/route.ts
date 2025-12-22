import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get("x-user") || "null");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDbUser = user;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentDbUser.id,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Post already liked" },
        { status: 400 }
      );
    }

    // Create like
    const newLike = await prisma.like.create({
      data: {
        userId: currentDbUser.id,
        postId: postId,
      },
    });

    return NextResponse.json({
      data: {
        id: newLike.id,
        userId: newLike.userId,
        postId: newLike.postId,
        createdAt: newLike.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    const user = JSON.parse(request.headers.get("x-user") || "null");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDbUser = user;

    // Delete like
    await prisma.like.deleteMany({
      where: {
        userId: currentDbUser.id,
        postId: postId,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error unliking post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
