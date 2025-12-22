import prisma from "@/lib/prisma";
import { PostType } from "../../generated/prisma/client";

export async function getUserPosts(
  username: string,
  type: "posts" | "reels" | "liked" | "saved",
  currentUserId?: string
) {
  // First get the user by username
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return [];
  }

  let posts;

  // Filter based on type
  if (type === "posts") {
    // Regular posts (text or image, not reels)
    posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        type: { in: [PostType.TEXT, PostType.IMAGE] },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (type === "reels") {
    // Only reels
    posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        type: PostType.VIDEO,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (type === "liked" && currentUserId) {
    // Posts liked by current user
    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentDbUser) {
      return [];
    }

    posts = await prisma.post.findMany({
      where: {
        likes: {
          some: { userId: currentDbUser.id },
        },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (type === "saved" && currentUserId) {
    // Posts saved by current user
    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentDbUser) {
      return [];
    }

    posts = await prisma.post.findMany({
      where: {
        bookmarks: {
          some: { userId: currentDbUser.id },
        },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Default to empty for liked/saved if no current user
    return [];
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  // Check if current user has liked/saved each post
  if (currentUserId) {
    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (currentDbUser) {
      const postIds = posts.map((p) => p.id);

      // Get liked posts
      const likedPosts = await prisma.like.findMany({
        where: {
          userId: currentDbUser.id,
          postId: { in: postIds },
        },
        select: { postId: true },
      });

      // Get saved posts
      const savedPosts = await prisma.bookmark.findMany({
        where: {
          userId: currentDbUser.id,
          postId: { in: postIds },
        },
        select: { postId: true },
      });

      const likedPostIds = new Set(likedPosts.map((lp) => lp.postId));
      const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

      return posts.map((post) => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        url: post.url,
        type: post.type,
        createdAt: post.createdAt,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }));
    }
  }

  return posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    content: post.content,
    url: post.url,
    type: post.type,
    createdAt: post.createdAt,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLiked: false,
    isSaved: false,
  }));
}
