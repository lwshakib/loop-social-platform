import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> | { postId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Better Auth, user is the database user
    const currentDbUser = user;

    if (!currentDbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Better Auth, user is the database user
    const currentDbUser = user;

    if (!currentDbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
