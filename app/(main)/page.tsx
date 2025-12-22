"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Repeat2,
  Share,
  Upload,
  X,
} from "lucide-react";
import { useSocialStore } from "@/context";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
} from "@/lib/post-actions";
import VideoPlayer from "./_components/video-player";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
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
  };
};

type StoryGroup = {
  userId: string;
  user?: {
    id: string;
    username?: string;
    name?: string;
    imageUrl?: string | null;
  };
  stories: Array<{
    id: string;
    userId: string;
    caption: string;
    url: string;
    createdAt: string;
    expiresAt: string;
  }>;
};

const StorySkeleton = () => (
  <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0">
    <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-border" />
    <Skeleton className="h-2 w-12 sm:w-14 rounded-full" />
  </div>
);

const StoriesSkeletonRow = () => (
  <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden w-full">
    {Array.from({ length: 8 }).map((_, idx) => (
      <StorySkeleton key={idx} />
    ))}
  </div>
);

const PostSkeleton = () => (
  <div className="border-b border-border w-full">
    <div className="px-3 py-3 w-full">
      <div className="flex items-start gap-2.5">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
          </div>
          <Skeleton className="h-52 sm:h-64 md:h-80 w-full max-w-xl rounded-xl" />
          <div className="flex items-center gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-7 w-12 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Helper function to format time ago
const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const postDate = typeof date === "string" ? new Date(date) : date;
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

export default function HomePage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [isCreateStoryDialogOpen, setIsCreateStoryDialogOpen] = useState(false);
  const [createStoryData, setCreateStoryData] = useState({
    caption: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [followingUserIds, setFollowingUserIds] = useState<Set<string>>(
    new Set()
  );
  const [followingBusyIds, setFollowingBusyIds] = useState<Set<string>>(
    new Set()
  );
  const [suggestedUsers, setSuggestedUsers] = useState<StoryGroup[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const checkScrollButtons = () => {
    if (storiesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollStories = (direction: "left" | "right") => {
    if (storiesScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === "left"
          ? storiesScrollRef.current.scrollLeft - scrollAmount
          : storiesScrollRef.current.scrollLeft + scrollAmount;

      storiesScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(checkScrollButtons, 100);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch("/api/stories");

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setStories(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setIsLoadingStories(false);
      }
    };

    fetchStories();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await fetch("/api/posts/feed?limit=50");

        if (response.ok) {
          const result = await response.json();
          if (result.data?.posts) {
            setPosts(result.data.posts);

            // Initialize liked and saved posts
            const likedPostIds = result.data.posts
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(likedPostIds));

            const savedPostIds = result.data.posts
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  // Set up Intersection Observer to pause videos when they scroll out of view
  useEffect(() => {
    if (posts.length === 0) return;

    const timeoutId = setTimeout(() => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const container = entry.target as HTMLElement;
            const video = container.querySelector("video");
            if (!video) return;

            if (!entry.isIntersecting && !video.paused) {
              video.pause();
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px",
        }
      );

      posts.forEach((post) => {
        if (post.type === "reel" && post.imageUrl) {
          const element = document.querySelector(
            `[data-video-id="${post.id}"]`
          );
          if (element && observerRef.current) {
            observerRef.current.observe(element);
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [posts]);

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await fetch("/api/users/suggestions");

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setSuggestedUsers(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const refreshStories = async () => {
    try {
      const response = await fetch("/api/stories");

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setStories(result.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing stories:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateStoryData((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (
      file &&
      (file.type.startsWith("image/") || file.type.startsWith("video/"))
    ) {
      setCreateStoryData((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCreateStoryClose = () => {
    setIsCreateStoryDialogOpen(false);
    setCreateStoryData({
      caption: "",
      file: null,
      preview: null,
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleCreateStorySubmit = async () => {
    try {
      if (!currentUser) {
        toast.error("Authentication Required", {
          description: "You must be logged in to create a story.",
        });
        return;
      }

      let storyType: "text" | "image" | "video" = "text";
      let storyUrl = "";

      if (createStoryData.file) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          if (createStoryData.file.type.startsWith("image/")) {
            storyType = "image";
          } else if (createStoryData.file.type.startsWith("video/")) {
            storyType = "video";
          }

          const { data: response } = await axios.get(
            "/api/cloudinary/signature",
            {
              params: {
                folder: "loop-social-platform/stories",
              },
            }
          );

          const signature = response.data;
          const uploadType = storyType === "video" ? "video" : "image";
          const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`;

          const formData = new FormData();
          formData.append("file", createStoryData.file);
          formData.append("api_key", signature.apiKey);
          formData.append("timestamp", signature.timestamp.toString());
          formData.append("folder", signature.folder);
          formData.append("signature", signature.signature);

          const { data: uploadResponse } = await axios.post(
            uploadApi,
            formData,
            {
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(progress);
                }
              },
            }
          );

          storyUrl = uploadResponse.secure_url || uploadResponse.url;
          setIsUploading(false);
          setUploadProgress(0);
        } catch (error) {
          setIsUploading(false);
          setUploadProgress(0);
          console.error("Error uploading file:", error);
          toast.error("Upload Failed", {
            description: "Failed to upload file. Please try again.",
          });
          return;
        }
      }

      const requestBody: {
        caption?: string;
        url?: string;
      } = {};

      if (createStoryData.caption.trim()) {
        requestBody.caption = createStoryData.caption.trim();
      }

      if (storyUrl) {
        requestBody.url = storyUrl;
      }

      if (!requestBody.caption && !requestBody.url) {
        toast.error("Validation Error", {
          description: "Caption or media is required",
        });
        return;
      }

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success("Story Created", {
          description: "Your story has been created successfully!",
        });
        handleCreateStoryClose();
        await refreshStories();
      } else {
        const error = await response.json();
        toast.error("Failed to Create Story", {
          description:
            error.message || "Failed to create story. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating story:", error);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Error", {
        description:
          "An error occurred while creating the story. Please try again.",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (createStoryData.preview) {
        URL.revokeObjectURL(createStoryData.preview);
      }
    };
  }, [createStoryData.preview]);

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

  const handleFollowSuggestion = async (
    userId: string,
    username?: string | null
  ) => {
    if (!currentUser || !username) return;

    const isFollowing = followingUserIds.has(userId);
    const prevSet = new Set(followingUserIds);

    setFollowingBusyIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to follow user");
      }
      setFollowingUserIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    } catch (error) {
      console.error("Error following suggested user:", error);
      setFollowingUserIds(prevSet);
    } finally {
      setFollowingBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getAvatarUrl = () => {
    return currentUser?.image || "";
  };

  const getAvatarFallback = () => {
    return currentUser?.username?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:px-8 overflow-x-hidden relative left-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 min-w-0 w-full relative z-0 pb-4">
          {/* Stories Section */}
          <div className="bg-card border border-border p-2 sm:p-3 md:p-4 overflow-hidden relative rounded-lg sm:rounded-none w-full shadow-sm">
            {/* Left Arrow */}
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={() => scrollStories("left")}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={() => scrollStories("right")}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}

            <div
              ref={storiesScrollRef}
              className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
              onScroll={checkScrollButtons}
            >
              {/* Create Story Circle */}
              {currentUser && (
                <div
                  className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
                  onClick={() => setIsCreateStoryDialogOpen(true)}
                >
                  <div className="relative p-0.5 rounded-full border-2 border-border">
                    <div className="rounded-full bg-background p-0.5">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage
                          src={getAvatarUrl()}
                          alt={currentUser.username || ""}
                        />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {getAvatarFallback()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center">
                    Your story
                  </span>
                </div>
              )}

              {isLoadingStories ? (
                <StoriesSkeletonRow />
              ) : stories.length === 0 ? (
                !currentUser && (
                  <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
                    No stories available
                  </div>
                )
              ) : (
                stories.map((storyGroup) => {
                  if (
                    !storyGroup.user ||
                    !storyGroup.stories ||
                    storyGroup.stories.length === 0
                  ) {
                    return null;
                  }
                  const firstStory = storyGroup.stories[0];
                  return (
                    <div
                      key={storyGroup.userId}
                      className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
                      onClick={() => {
                        if (storyGroup.user?.username && firstStory?.id) {
                          router.push(
                            `/stories/${storyGroup.user.username}/${firstStory.id}`
                          );
                        }
                      }}
                    >
                      <div className="relative p-0.5 rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-500">
                        <div className="rounded-full bg-background p-0.5">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                            <AvatarImage
                              src={storyGroup.user.imageUrl || ""}
                              alt={storyGroup.user.username || ""}
                            />
                            <AvatarFallback className="text-xs sm:text-sm">
                              {storyGroup.user.name?.[0] ||
                                storyGroup.user.username?.[0] ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center hover:underline">
                        {storyGroup.user.username || "unknown"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-0 w-full">
            {isLoadingPosts ? (
              <div className="space-y-0 w-full">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <PostSkeleton key={idx} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No posts available</p>
              </div>
            ) : (
              posts.map((post) => {
                const avatarUrl =
                  post.user.imageUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;

                return (
                  <div
                    key={post.id}
                    className="border-b border-border hover:bg-accent/5 transition-colors cursor-pointer w-full"
                    onClick={() => router.push(`/p/${post.id}`)}
                  >
                    <div className="px-3 py-2.5 w-full min-w-0">
                      {/* Post Header and Content - Twitter Style */}
                      <div className="flex items-start gap-2.5">
                        <Link
                          href={`/${post.user.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        >
                          <Avatar className="h-10 w-10 cursor-pointer">
                            <AvatarImage
                              src={avatarUrl}
                              alt={post.user.username}
                            />
                            <AvatarFallback className="text-xs">
                              {(post.user.name ||
                                post.user.username)[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <Link
                              href={`/${post.user.username}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-sm hover:underline cursor-pointer"
                            >
                              {post.user.name || post.user.username}
                            </Link>
                            <Link
                              href={`/${post.user.username}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-muted-foreground hover:underline cursor-pointer"
                            >
                              @{post.user.username}
                            </Link>
                            <span className="text-sm text-muted-foreground">
                              ·
                            </span>
                            <span className="text-sm text-muted-foreground hover:underline">
                              {formatTimeAgo(post.createdAt)}
                            </span>
                          </div>

                          {/* Post Content */}
                          <div className="text-sm mb-2 whitespace-pre-wrap wrap-break-word leading-5">
                            {post.content}
                          </div>

                          {/* Post Image or Video */}
                          {post.imageUrl && post.type === "image" && (
                            <div className="rounded-xl overflow-hidden mb-2 w-full max-w-lg">
                              <img
                                src={post.imageUrl}
                                alt="Post"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}
                          {post.imageUrl && post.type === "reel" && (
                            <div
                              className="mb-2 w-full max-w-lg"
                              data-video-id={post.id}
                            >
                              <VideoPlayer
                                src={post.imageUrl}
                                videoId={post.id}
                                containerClassName="w-full"
                                className="max-h-[400px] rounded-xl"
                                intersectionObserverId={post.id}
                                maxHeight="400px"
                                autoPlay={false}
                                loop={true}
                                initialMuted={true}
                                showControls={true}
                              />
                            </div>
                          )}

                          {/* Action Buttons - Compact Twitter Style */}
                          <div
                            className="flex items-center justify-between max-w-md -ml-1 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-8 px-2 group"
                              onClick={() => router.push(`/p/${post.id}`)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                              <span className="text-xs">
                                {formatNumber(post.commentsCount)}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full h-8 px-2 group"
                            >
                              <Repeat2 className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                              <span className="text-xs">0</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className={`rounded-full h-8 px-2 group ${
                                likedPosts.has(post.id)
                                  ? "text-red-500 hover:bg-red-500/10"
                                  : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform ${
                                  likedPosts.has(post.id) ? "fill-current" : ""
                                }`}
                              />
                              <span className="text-xs">
                                {formatNumber(post.likesCount)}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-8 px-2 group"
                            >
                              <Share className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSave(post.id)}
                              className={`rounded-full h-8 px-2 group ${
                                savedPosts.has(post.id)
                                  ? "text-primary hover:bg-primary/10"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                              }`}
                            >
                              <Bookmark
                                className={`h-4 w-4 group-hover:scale-110 transition-transform ${
                                  savedPosts.has(post.id) ? "fill-current" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4 md:space-y-6 w-72 xl:w-80">
          {/* Suggestions */}
          <div className="bg-card border rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="font-semibold text-xs md:text-sm text-muted-foreground">
                Suggestions for you
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] md:text-xs h-auto py-1"
              >
                See All
              </Button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {suggestedUsers
                .filter((userGroup) => {
                  if (currentUser?.id && userGroup.userId === currentUser.id) {
                    return false;
                  }
                  if (
                    currentUser?.username &&
                    userGroup.user?.username === currentUser.username
                  ) {
                    return false;
                  }
                  return userGroup.user !== null;
                })
                .slice(0, 5)
                .map((userGroup) => {
                  if (!userGroup.user) return null;
                  return (
                    <div
                      key={userGroup.userId}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Link href={`/${userGroup.user?.username}`}>
                          <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 cursor-pointer">
                            <AvatarImage
                              src={userGroup.user.imageUrl || ""}
                              alt={userGroup.user.username || ""}
                            />
                            <AvatarFallback className="text-[10px] md:text-xs">
                              {userGroup.user.name?.[0] ||
                                userGroup.user.username?.[0] ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${userGroup.user?.username}`}
                            className="font-semibold text-xs md:text-sm truncate cursor-pointer hover:underline block"
                          >
                            {userGroup.user.username || "unknown"}
                          </Link>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            Suggested for you
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary text-[10px] md:text-xs h-auto py-1 shrink-0"
                        disabled={followingBusyIds.has(userGroup.userId)}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleFollowSuggestion(
                            userGroup.userId,
                            userGroup.user?.username
                          );
                        }}
                      >
                        {followingUserIds.has(userGroup.userId)
                          ? "Following"
                          : "Follow"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Create Story Dialog */}
      <Dialog
        open={isCreateStoryDialogOpen}
        onOpenChange={setIsCreateStoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[90vh] p-3 sm:p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Share a moment with your story. It will disappear after 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 py-3 sm:py-4 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
            {/* Left Side - Drag and Drop Field */}
            <div className="space-y-2 flex flex-col order-2 sm:order-1">
              <Label className="text-sm sm:text-base">Media (Optional)</Label>
              <div
                className="border-2 border-dashed rounded-lg flex-1 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[250px] sm:min-h-[300px] md:min-h-[400px]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {createStoryData.preview ? (
                  <div className="space-y-3 sm:space-y-4 w-full h-full flex flex-col items-center justify-center p-3 sm:p-4">
                    {createStoryData.file?.type.startsWith("video/") ? (
                      <video
                        src={createStoryData.preview}
                        className="max-h-[250px] sm:max-h-[300px] md:max-h-[400px] max-w-full rounded-lg object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={createStoryData.preview}
                        alt="Preview"
                        className="max-h-[250px] sm:max-h-[300px] md:max-h-[400px] max-w-full rounded-lg object-contain"
                      />
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCreateStoryData((prev) => ({
                            ...prev,
                            file: null,
                            preview: null,
                          }));
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 text-center p-4 sm:p-6 md:p-8">
                    <Upload className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">
                        Drag and drop an image or video here, or click to browse
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Supports: JPG, PNG, GIF, MP4
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="story-file-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.getElementById("story-file-upload")?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Caption Field */}
            <div className="flex flex-col h-full order-1 sm:order-2 min-h-[250px] sm:min-h-[300px] md:min-h-0">
              {/* Profile Section */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={getAvatarUrl()} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-xs sm:text-sm truncate">
                  {currentUser?.username || "You"}
                </span>
              </div>

              {/* Caption Textarea Container */}
              <div className="flex-1 flex flex-col relative bg-muted/30 rounded-lg overflow-hidden">
                <textarea
                  id="story-caption"
                  placeholder="Write a caption... (Optional for media, required for text stories)"
                  value={createStoryData.caption}
                  onChange={(e) =>
                    setCreateStoryData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  maxLength={2200}
                  className="flex-1 w-full bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none"
                />

                {/* Character Count */}
                <div className="flex items-center justify-end px-3 sm:px-4 py-2 sm:py-3 border-t bg-muted/50">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {createStoryData.caption.length.toLocaleString()}/2,200
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:gap-3">
            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCreateStoryClose}
                disabled={isUploading}
                className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateStorySubmit}
                disabled={
                  (!createStoryData.caption.trim() && !createStoryData.file) ||
                  isUploading
                }
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
              >
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Create Story"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
