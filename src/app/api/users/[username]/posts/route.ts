import { NextRequest, NextResponse } from "next/server";
import { getUserPosts } from "@/actions/posts";
import { currentUser } from "@clerk/nextjs/server";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import db from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") || "posts") as
      | "posts"
      | "reels"
      | "liked"
      | "saved";

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
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

    // Get posts
    const posts = await getUserPosts(username, type, currentUserId);

    // Map posts to response format
    const response = posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.url, // Map url to imageUrl for frontend compatibility
      type: post.type,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      createdAt: post.createdAt.toISOString(),
      isLiked: post.isLiked || false,
      isSaved: post.isSaved || false,
    }));

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

