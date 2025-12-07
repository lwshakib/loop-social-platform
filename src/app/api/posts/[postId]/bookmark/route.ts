import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { bookmarksTable, usersTable, postsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Check if bookmark already exists
    const [existingBookmark] = await db
      .select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, currentDbUser.id),
          eq(bookmarksTable.postId, postId)
        )
      )
      .limit(1);

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Post already bookmarked" },
        { status: 400 }
      );
    }

    // Create bookmark
    const [newBookmark] = await db
      .insert(bookmarksTable)
      .values({
        userId: currentDbUser.id,
        postId: postId,
      })
      .returning();

    return NextResponse.json({
      data: {
        id: newBookmark.id,
        userId: newBookmark.userId,
        postId: newBookmark.postId,
        createdAt: newBookmark.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error bookmarking post:", error);
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

    // Delete bookmark
    await db
      .delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, currentDbUser.id),
          eq(bookmarksTable.postId, postId)
        )
      );

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error unbookmarking post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
