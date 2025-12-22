import { NextRequest, NextResponse } from "next/server";
import { getUserPosts } from "@/actions/posts";
import prisma from "@/lib/prisma";

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

    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get("x-user") || "null");
    const currentUserId = user?.id;

    // Get posts
    const posts = await getUserPosts(username, type, currentUserId);

    // Map posts to response format
    const response = posts.map((post) => {
      const likesCount = Number(post.likesCount ?? 0);
      const commentsCount = Number(post.commentsCount ?? 0);

      return {
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.url, // Map url to imageUrl for frontend compatibility
        type: post.type,
        likesCount,
        commentsCount,
        createdAt: post.createdAt.toISOString(),
        isLiked: Boolean(post.isLiked),
        isSaved: Boolean(post.isSaved),
      };
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
