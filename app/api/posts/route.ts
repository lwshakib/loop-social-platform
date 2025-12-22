import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { PostType } from "../../../../generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Better Auth, user.id is the database id
    const currentDbUser = user;

    if (!currentDbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, url, type } = body;

    // Validate post type
    const validTypes = ["text", "image", "reel"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
    }

    // Validate content
    if (!content && !url) {
      return NextResponse.json(
        { error: "Post must have either content or an image/video" },
        { status: 400 }
      );
    }

    // Map type string to PostType enum
    const postTypeMap: Record<string, PostType> = {
      text: PostType.TEXT,
      image: PostType.IMAGE,
      reel: PostType.VIDEO,
    };

    // Create post
    const newPost = await prisma.post.create({
      data: {
        userId: currentDbUser.id,
        content: content || "",
        url: url || "",
        type: postTypeMap[type],
      },
    });

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
