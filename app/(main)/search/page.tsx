"use client";

import {
  Search as SearchIcon,
  User,
  FileText,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
} from "@/lib/post-actions";
import { useSocialStore } from "@/context";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type UserResult = {
  id: string;
  username: string;
  name: string;
  imageUrl: string | null;
  bio: string;
  isVerified: boolean;
};

type PostResult = {
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
  };
};

const UsersSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center gap-4 p-4 rounded-lg border border-border"
      >
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    ))}
  </div>
);

const PostsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// Helper function to format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    const value = num / 1000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export default function SearchPage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "posts">("all");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ id: string; term: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch history once on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const res = await fetch("/api/search/history");
        if (res.ok) {
          const json = await res.json();
          setHistory(json.data || []);
        }
      } catch (error) {
        console.error("Error fetching search history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  // Save search term when user submits a non-empty debounced query
  useEffect(() => {
    const saveTerm = async (term: string) => {
      try {
        await fetch("/api/search/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ term }),
        });
        setHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.term.toLowerCase() !== term.toLowerCase()
          );
          return [{ id: crypto.randomUUID(), term }, ...filtered].slice(0, 10);
        });
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    };

    if (debouncedSearchQuery.trim()) {
      saveTerm(debouncedSearchQuery.trim());
    }
  }, [debouncedSearchQuery]);

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearchQuery.trim()) {
        setUsers([]);
        setPosts([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(
            debouncedSearchQuery
          )}&type=${activeTab}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setUsers(result.data.users || []);
            setPosts(result.data.posts || []);

            // Initialize liked and saved posts
            const likedPostIds = (result.data.posts || [])
              .filter((post: PostResult) => post.isLiked)
              .map((post: PostResult) => post.id);
            setLikedPosts(new Set(likedPostIds));

            const savedPostIds = (result.data.posts || [])
              .filter((post: PostResult) => post.isSaved)
              .map((post: PostResult) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchQuery, activeTab]);

  const handleLike = async (postId: string) => {
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

  const handleSave = async (postId: string) => {
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

  const hasResults = users.length > 0 || posts.length > 0;
  const showResults = debouncedSearchQuery.trim() && (isLoading || hasResults);

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">
            Find people, posts, and content
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for users or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Tabs */}
        {showResults && (
          <div className="flex gap-2 mb-6 border-b">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              onClick={() => setActiveTab("all")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              All
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Users ({users.length})
            </Button>
            <Button
              variant={activeTab === "posts" ? "default" : "ghost"}
              onClick={() => setActiveTab("posts")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Posts ({posts.length})
            </Button>
          </div>
        )}

        {/* Search Results */}
        {isLoading ? (
          <div className="space-y-6 py-6">
            {(activeTab === "all" || activeTab === "users") && (
              <UsersSkeleton />
            )}
            {(activeTab === "all" || activeTab === "posts") && (
              <PostsSkeleton />
            )}
          </div>
        ) : showResults ? (
          <div className="space-y-6">
            {/* Users Results */}
            {(activeTab === "all" || activeTab === "users") &&
              users.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Users</h2>
                  <div className="space-y-3">
                    {users.map((user) => {
                      const avatarUrl =
                        user.imageUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                      return (
                        <Link
                          key={user.id}
                          href={`/${user.username}`}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} alt={user.username} />
                            <AvatarFallback>
                              {user.name[0]?.toUpperCase() ||
                                user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {user.name}
                              </p>
                              {user.isVerified && (
                                <span className="text-primary">✓</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.username}
                            </p>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                          </div>
                          <User className="h-5 w-5 text-muted-foreground shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Posts Results */}
            {(activeTab === "all" || activeTab === "posts") &&
              posts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Posts</h2>
                  <div className="space-y-4">
                    {posts.map((post) => {
                      const avatarUrl =
                        post.user.imageUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;
                      return (
                        <div
                          key={post.id}
                          className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                        >
                          {/* Post Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <Link href={`/${post.user.username}`}>
                              <Avatar className="h-10 w-10 shrink-0 cursor-pointer">
                                <AvatarImage
                                  src={avatarUrl}
                                  alt={post.user.username}
                                />
                                <AvatarFallback className="text-sm">
                                  {(post.user.name ||
                                    post.user.username)[0]?.toUpperCase() ||
                                    "U"}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  href={`/${post.user.username}`}
                                  className="font-bold text-[15px] hover:underline cursor-pointer leading-5"
                                >
                                  {post.user.name || post.user.username}
                                </Link>
                                <Link
                                  href={`/${post.user.username}`}
                                  className="text-[15px] text-muted-foreground hover:underline cursor-pointer leading-5"
                                >
                                  {post.user.username}
                                </Link>
                                <span className="text-[15px] text-muted-foreground leading-5">
                                  ·
                                </span>
                                <span className="text-[15px] text-muted-foreground hover:underline leading-5">
                                  {formatTimeAgo(post.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          <div
                            className="text-[15px] mb-3 whitespace-pre-wrap wrap-break-word leading-5 cursor-pointer"
                            onClick={() => router.push(`/p/${post.id}`)}
                          >
                            {post.content}
                          </div>

                          {/* Post Image */}
                          {post.imageUrl && post.type === "image" && (
                            <div
                              className="rounded-2xl overflow-hidden mb-3 w-full cursor-pointer"
                              onClick={() => router.push(`/p/${post.id}`)}
                            >
                              <img
                                src={post.imageUrl}
                                alt="Post"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}

                          {/* Post Type Indicator */}
                          {post.type === "reel" && (
                            <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                              <Play className="h-4 w-4" />
                              <span>Reel</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div
                            className="flex items-center gap-4 mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 group"
                              onClick={() => router.push(`/p/${post.id}`)}
                            >
                              <MessageCircle className="h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform" />
                              <span className="text-[13px]">
                                {formatNumber(post.commentsCount)}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className={`rounded-full h-9 px-2 group ${
                                likedPosts.has(post.id)
                                  ? "text-red-500 hover:bg-red-500/10"
                                  : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              }`}
                            >
                              <Heart
                                className={`h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform ${
                                  likedPosts.has(post.id) ? "fill-current" : ""
                                }`}
                              />
                              <span className="text-[13px]">
                                {formatNumber(post.likesCount)}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSave(post.id)}
                              className={`rounded-full h-9 px-2 group ${
                                savedPosts.has(post.id)
                                  ? "text-primary hover:bg-primary/10"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                              }`}
                            >
                              <Bookmark
                                className={`h-[18.75px] w-[18.75px] group-hover:scale-110 transition-transform ${
                                  savedPosts.has(post.id) ? "fill-current" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* No Results */}
            {!isLoading && hasResults === false && (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No results found for &quot;{debouncedSearchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-12">
            <div className="text-center space-y-2">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Start typing to search for people, posts, and content.
              </p>
            </div>
            {isLoadingHistory ? (
              <div className="flex gap-2 flex-wrap justify-center">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="flex gap-2 flex-wrap justify-center">
                {history.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSearchQuery(item.term)}
                  >
                    {item.term}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
