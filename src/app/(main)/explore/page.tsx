"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Heart, MessageCircle, Bookmark, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSocialStore } from "@/context";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
} from "@/lib/post-actions";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  type: "text" | "image" | "reel";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    imageUrl: string | null;
    isVerified?: boolean;
  };
};

type SuggestedUser = {
  id: string;
  username: string;
  name: string;
  imageUrl: string | null;
  bio: string;
  isVerified?: boolean;
};

const ExplorePostsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
    {Array.from({ length: 9 }).map((_, idx) => (
      <Skeleton key={idx} className="aspect-square w-full rounded-lg" />
    ))}
  </div>
);

const SuggestedUsersSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
      >
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    ))}
  </div>
);

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    const value = num / 1000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export default function ExplorePage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Fetch explore data
  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/explore?limit=30");

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setPosts(result.data.posts || []);
            setSuggestedUsers(result.data.suggestedUsers || []);

            // Initialize liked and saved posts
            const likedPostIds = (result.data.posts || [])
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(likedPostIds));

            const savedPostIds = (result.data.posts || [])
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.isLiked || false;
    const previousLikesCount = post.likesCount || 0;

    // Optimistic update
    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likesCount: Math.max(0, p.likesCount - 1),
                isLiked: false,
              }
            : p
        )
      );
    } else {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likesCount: p.likesCount + 1, isLiked: true }
            : p
        )
      );
    }

    try {
      if (isLiked) {
        await toggleUnlike(postId);
      } else {
        await toggleLike(postId);
      }
    } catch (error) {
      // Revert on error
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likesCount: previousLikesCount,
                isLiked: isLiked,
              }
            : p
        )
      );
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isSaved = post.isSaved || false;

    // Optimistic update
    if (isSaved) {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: false } : p))
      );
    } else {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: true } : p))
      );
    }

    try {
      if (isSaved) {
        await toggleUnbookmark(postId);
      } else {
        await toggleBookmark(postId);
      }
    } catch (error) {
      // Revert on error
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: isSaved } : p))
      );
      console.error("Error saving post:", error);
    }
  };

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Explore</h1>
          </div>
          <p className="text-muted-foreground">
            Discover trending posts and connect with new people
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Trending Posts Grid */}
          <div className="lg:col-span-2">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Trending Posts</h2>
              {isLoading ? (
                <ExplorePostsSkeleton />
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No posts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {posts.map((post) => {
                    const avatarUrl =
                      post.user.imageUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;

                    return (
                      <div
                        key={post.id}
                        className="group relative aspect-square bg-muted overflow-hidden cursor-pointer rounded-lg"
                        onClick={() => router.push(`/p/${post.id}`)}
                      >
                        {post.imageUrl ? (
                          post.type === "reel" ? (
                            <div className="relative w-full h-full">
                              <video
                                src={post.imageUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="h-8 w-8 text-white opacity-80" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={post.imageUrl}
                              alt="Post"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted p-4">
                            <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                              {post.content || "Post"}
                            </p>
                          </div>
                        )}

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-4 text-white">
                            <div className="flex items-center gap-1.5">
                              <Heart
                                className={`h-5 w-5 ${
                                  likedPosts.has(post.id)
                                    ? "fill-current text-red-500"
                                    : ""
                                }`}
                              />
                              <span className="text-sm font-semibold">
                                {formatNumber(post.likesCount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="h-5 w-5" />
                              <span className="text-sm font-semibold">
                                {formatNumber(post.commentsCount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons overlay */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                            onClick={(e) => handleLike(post.id, e)}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                likedPosts.has(post.id)
                                  ? "fill-current text-red-500"
                                  : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                            onClick={(e) => handleSave(post.id, e)}
                          >
                            <Bookmark
                              className={`h-4 w-4 ${
                                savedPosts.has(post.id)
                                  ? "fill-current text-primary"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Suggested Users */}
          <div className="lg:col-span-1">
            <section>
              <h2 className="text-xl font-semibold mb-4">Suggested Users</h2>
              {isLoading ? (
                <SuggestedUsersSkeleton />
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No suggestions available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map((user) => {
                    const avatarUrl =
                      user.imageUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

                    return (
                      <Link
                        key={user.id}
                        href={`/${user.username}`}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback>
                            {user.name[0] || user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold truncate">
                              {user.username}
                            </p>
                            {user.isVerified && (
                              <span className="text-primary">✓</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.name}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
