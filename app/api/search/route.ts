import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, users, posts

    if (!query.trim()) {
      return NextResponse.json({
        data: {
          users: [],
          posts: [],
        },
      });
    }

    // Get current authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserData = session?.user;
    let currentUserId: string | undefined;

    if (currentUserData) {
      currentUserId = currentUserData.id;
    }

    const searchTerm = query.trim();

    // Search users
    let users: any[] = [];
    if (type === "all" || type === "users") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: "insensitive" } },
            { name: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          bio: true,
          // isVerified: true, // isVerified is not in schema
        },
        take: 10,
      });
    }

    // Search posts
    let posts: any[] = [];
    if (type === "all" || type === "posts") {
      const foundPosts = await prisma.post.findMany({
        where: {
          content: { contains: searchTerm, mode: "insensitive" },
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      posts = foundPosts.map((p) => ({ ...p, type: p.type as string }));

      // Check if current user has liked/saved each post
      if (currentUserId && posts.length > 0) {
        const postIds = posts.map((p) => p.id);

        // Get liked posts
        const likedPosts = await prisma.like.findMany({
          where: {
            userId: currentUserId,
            postId: { in: postIds },
          },
          select: { postId: true },
        });

        // Get saved posts
        const savedPosts = await prisma.bookmark.findMany({
          where: {
            userId: currentUserId,
            postId: { in: postIds },
          },
          select: { postId: true },
        });

        const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
        const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

        posts = posts.map((post) => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
          isSaved: savedPostIds.has(post.id),
        }));
      } else {
        posts = posts.map((post) => ({
          ...post,
          isLiked: false,
          isSaved: false,
        }));
      }
    }

    // Transform response
    const response = {
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        imageUrl: user.image,
        bio: user.bio,
        isVerified: false,
      })),
      posts: posts.map((post) => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.url,
        type: post.type,
        likesCount: post._count.likes || 0,
        commentsCount: post._count.comments || 0,
        createdAt: post.createdAt.toISOString(),
        isLiked: post.isLiked || false,
        isSaved: post.isSaved || false,
        user: {
          ...post.user,
          imageUrl: post.user.image,
        },
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
