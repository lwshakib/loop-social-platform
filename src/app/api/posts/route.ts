import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { postsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user's database record
    const [currentDbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, user.id))
      .limit(1);

    if (!currentDbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, url, type } = body;

    // Validate post type
    const validTypes = ["text", "image", "reel"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid post type" },
        { status: 400 }
      );
    }

    // Validate content
    if (!content && !url) {
      return NextResponse.json(
        { error: "Post must have either content or an image/video" },
        { status: 400 }
      );
    }

    // Create post
    const [newPost] = await db
      .insert(postsTable)
      .values({
        userId: currentDbUser.id,
        content: content || "",
        url: url || "",
        type: type as "text" | "image" | "reel",
      })
      .returning();

    return NextResponse.json({
      data: {
        id: newPost.id,
        userId: newPost.userId,
        content: newPost.content,
        url: newPost.url,
        type: newPost.type,
        createdAt: newPost.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

