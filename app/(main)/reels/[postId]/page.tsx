"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Play,
  Reply,
  Share,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSocialStore } from "@/context";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
  getPostComments,
  createComment,
} from "@/lib/post-actions";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string;
  type: "reel";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    imageUrl: string;
  };
};

const ReelPageSkeleton = () => (
  <div className="relative flex-1 h-screen overflow-hidden">
    <div className="absolute inset-0 flex">
      <div className="w-full md:w-3/5 h-full bg-black flex items-center justify-center">
        <Skeleton className="h-[70vh] w-full max-w-2xl rounded-3xl" />
      </div>
      <div className="hidden md:flex flex-1 flex-col bg-card border-l border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ReelCommentsSkeleton = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    ))}
  </div>
);

type Comment = {
  id: string;
  userId: string;
  postId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    imageUrl: string;
  };
  replies?: Comment[];
};

// Helper function to format numbers (e.g., 82300 -> 82.3K)
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return "0";
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

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

// Helper function to format time (MM:SS)
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function ReelsPage() {
  const router = useRouter();
  const params = useParams();
  const currentUser = useSocialStore((state) => state.user);
  const videoId = params?.postId as string;

  const [videos, setVideos] = useState<Post[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Post | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>(
    {}
  );
  const [videoDuration, setVideoDuration] = useState<Record<string, number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isUpdatingRef = useRef(false);

  // Fetch ALL videos initially (simpler with small dataset)
  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        setIsLoading(true);

        // Fetch all reels at once
        const response = await fetch("/api/reels");
        if (!response.ok) {
          throw new Error("Failed to fetch reels");
        }

        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setVideos(result.data);

          // If current videoId is not in the list, navigate to first video
          if (videoId && !result.data.some((v: Post) => v.id === videoId)) {
            router.replace(`/reels/${result.data[0].id}`, { scroll: false });
          }
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllVideos();
  }, []); // Only run once on mount

  // Set up Intersection Observer to detect which video is in view
  useEffect(() => {
    if (videos.length === 0 || isLoading) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isUpdatingRef.current) return;

        // Find the entry with the highest intersection ratio
        let bestEntry: IntersectionObserverEntry | null = null;
        let maxRatio = 0;

        entries.forEach((entry) => {
          const entryVideoId = entry.target.getAttribute("data-video-id");

          // Pause videos that are going out of view
          if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
            if (entryVideoId) {
              const video = videoRefs.current.get(entryVideoId);
              if (video && !video.paused) {
                video.pause();
                setPlayingVideos((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(entryVideoId);
                  return newSet;
                });
              }
            }
          }

          // Find the most visible video
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        });

        if (bestEntry && maxRatio > 0.5) {
          const newVideoId = (bestEntry as IntersectionObserverEntry).target.getAttribute("data-video-id");
          const currentVideoId = window.location.pathname.split("/").pop();

          if (newVideoId && newVideoId !== currentVideoId) {
            isUpdatingRef.current = true;

            // Pause all videos first
            videoRefs.current.forEach((video, id) => {
              if (id !== newVideoId && !video.paused) {
                video.pause();
                setPlayingVideos((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(id);
                  return newSet;
                });
              }
            });

            router.replace(`/reels/${newVideoId}`, { scroll: false });

            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 300);
          }
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: "-20% 0px -20% 0px", // Only trigger when video is in center 60% of viewport
      }
    );

    // Observe all video containers
    const timeoutId = setTimeout(() => {
      videos.forEach((video) => {
        const element = document.getElementById(`video-${video.id}`);
        if (element && observerRef.current) {
          observerRef.current.observe(element);
        }
      });
    }, 300);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [videos, router, isLoading]);

  // Scroll to video when videoId changes
  useEffect(() => {
    if (!videoId || isLoading || videos.length === 0) return;

    // Check if the video exists in our current list
    const videoExists = videos.some((v) => v.id === videoId);
    if (!videoExists) return;

    const timeoutId = setTimeout(() => {
      const element = document.getElementById(`video-${videoId}`);
      if (element && containerRef.current) {
        const container = containerRef.current;
        const elementTop = element.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollPosition =
          elementTop - containerHeight / 2 + element.clientHeight / 2;

        // Only scroll if not already at the right position
        const currentScroll = container.scrollTop;
        const scrollDiff = Math.abs(currentScroll - scrollPosition);

        if (scrollDiff > 50) {
          isUpdatingRef.current = true;
          container.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });

          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 500);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [videoId, videos, isLoading]);

  // Auto-play/pause videos based on videoId
  useEffect(() => {
    if (!videoId || isLoading || videos.length === 0) return;

    const timeoutId = setTimeout(() => {
      // Pause all videos first
      videoRefs.current.forEach((videoElement, id) => {
        if (id !== videoId) {
          if (!videoElement.paused) {
            videoElement.pause();
          }
          setPlayingVideos((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      });

      // Play current video
      const videoElement = videoRefs.current.get(videoId);
      if (videoElement) {
        videoElement.muted = mutedVideos.has(videoId);

        const playVideo = () => {
          if (videoElement.readyState >= 2) {
            // Only reset if video hasn't been played yet
            if (videoElement.currentTime > 1) {
              videoElement.currentTime = 0;
            }

            if (videoElement.paused) {
              videoElement.play().catch((error) => {
                console.error("Error playing video:", error);
              });
              // State will be updated by onPlay event handler
            }
          } else {
            videoElement.addEventListener("loadeddata", playVideo, {
              once: true,
            });
            videoElement.load();
          }
        };

        playVideo();
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [videoId, mutedVideos, isLoading, videos.length]);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    const video = videos.find((v) => v.id === postId);
    if (!video) return;

    const isLiked = video.isLiked || false;
    const previousLikesCount = video.likesCount || 0;

    // Optimistic update
    setVideos((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !isLiked,
              likesCount: isLiked
                ? Math.max(0, post.likesCount - 1)
                : post.likesCount + 1,
            }
          : post
      )
    );

    try {
      if (isLiked) {
        await toggleUnlike(postId);
      } else {
        await toggleLike(postId);
      }
    } catch (error) {
      // Revert on error
      setVideos((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: isLiked,
                likesCount: previousLikesCount,
              }
            : post
        )
      );
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async (postId: string) => {
    if (!currentUser) return;

    const video = videos.find((v) => v.id === postId);
    if (!video) return;

    const isSaved = video.isSaved || false;

    // Optimistic update
    setVideos((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isSaved: !isSaved } : post
      )
    );

    try {
      if (isSaved) {
        await toggleUnbookmark(postId);
      } else {
        await toggleBookmark(postId);
      }
    } catch (error) {
      // Revert on error
      setVideos((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: isSaved } : post
        )
      );
      console.error("Error saving post:", error);
    }
  };

  // Fetch comments when dialog opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedVideo?.id || !isCommentsDialogOpen) {
        setComments([]);
        return;
      }

      try {
        setIsLoadingComments(true);
        const result = await getPostComments(selectedVideo.id);
        if (result.data) {
          setComments(result.data);
          setReplyingTo(null);
          setReplyText({});
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [selectedVideo?.id, isCommentsDialogOpen]);

  const handleSubmitComment = async (parentId?: string) => {
    const commentText = parentId
      ? replyText[parentId]?.trim()
      : newComment.trim();

    if (!commentText || !selectedVideo?.id) {
      return;
    }

    if (!currentUser) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      const result = await createComment(
        selectedVideo.id,
        commentText,
        parentId
      );

      if (result.data) {
        if (parentId) {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.id === parentId) {
                const existingReplies = comment.replies || [];
                return {
                  ...comment,
                  replies: [...existingReplies, result.data],
                };
              }
              return comment;
            })
          );
          setReplyText((prev) => ({ ...prev, [parentId]: "" }));
          setReplyingTo(null);
        } else {
          setComments((prev) => [result.data, ...prev]);
          setNewComment("");
        }

        setVideos((prev) =>
          prev.map((video) =>
            video.id === selectedVideo.id
              ? { ...video, commentsCount: video.commentsCount + 1 }
              : video
          )
        );
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return <ReelPageSkeleton />;
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No videos found</p>
        </div>
      </div>
    );
  }

  const scrollToNext = () => {
    if (videos.length === 0 || isUpdatingRef.current) return;

    const currentIndex = videos.findIndex((v) => v.id === videoId);
    const nextIndex = currentIndex < videos.length - 1 ? currentIndex + 1 : 0;
    const nextVideo = videos[nextIndex];

    if (nextVideo) {
      router.replace(`/reels/${nextVideo.id}`, { scroll: false });
    }
  };

  const scrollToPrevious = () => {
    if (videos.length === 0 || isUpdatingRef.current) return;

    const currentIndex = videos.findIndex((v) => v.id === videoId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
    const prevVideo = videos[prevIndex];

    if (prevVideo) {
      router.replace(`/reels/${prevVideo.id}`, { scroll: false });
    }
  };

  return (
    <div className="relative flex-1 h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth max-w-full mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {videos.map((video) => {
          const avatarUrl =
            video.user.imageUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.user.username}`;

          return (
            <div
              key={video.id}
              id={`video-${video.id}`}
              data-video-id={video.id}
              className="h-screen w-full snap-start snap-always flex items-center justify-center bg-background relative"
            >
              {/* Video Container - 95vh height with glassmorphism background */}
              <div className="w-full h-[98vh] flex items-end justify-center gap-4 relative pb-4">
                {/* Glassmorphism container around video - 9:16 aspect ratio */}
                <div
                  className="h-full w-full max-w-[calc(98vh*9/16)] flex items-center justify-center relative bg-background/30 backdrop-blur-2xl rounded-2xl shadow-2xl p-2 sm:p-4 group"
                  style={{ aspectRatio: "9/16" }}
                >
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current.set(video.id, el);
                        el.muted = mutedVideos.has(video.id);
                        el.addEventListener("timeupdate", () => {
                          setVideoProgress((prev) => ({
                            ...prev,
                            [video.id]: el.currentTime,
                          }));
                        });
                        el.addEventListener("loadedmetadata", () => {
                          setVideoDuration((prev) => ({
                            ...prev,
                            [video.id]: el.duration,
                          }));
                        });
                      } else {
                        videoRefs.current.delete(video.id);
                      }
                    }}
                    src={video.imageUrl}
                    className="h-full w-full object-contain rounded-lg border border-white/10 cursor-pointer"
                    loop
                    muted={mutedVideos.has(video.id)}
                    playsInline
                    onClick={() => {
                      const videoElement = videoRefs.current.get(video.id);
                      if (videoElement) {
                        if (videoElement.paused) {
                          videoElement.play().catch((error) => {
                            console.error("Error playing video:", error);
                          });
                        } else {
                          videoElement.pause();
                        }
                      }
                    }}
                    onPlay={() => {
                      setPlayingVideos((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(video.id);
                        return newSet;
                      });
                    }}
                    onPause={() => {
                      setPlayingVideos((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(video.id);
                        return newSet;
                      });
                    }}
                  />

                  {/* Video Player Controls - Top Right */}
                  <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                    <button
                      onClick={() => {
                        const videoElement = videoRefs.current.get(video.id);
                        if (videoElement) {
                          const isMuted = mutedVideos.has(video.id);
                          if (isMuted) {
                            setMutedVideos((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(video.id);
                              return newSet;
                            });
                            videoElement.muted = false;
                          } else {
                            setMutedVideos((prev) => {
                              const newSet = new Set(prev);
                              newSet.add(video.id);
                              return newSet;
                            });
                            videoElement.muted = true;
                          }
                        }
                      }}
                      className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                      aria-label={mutedVideos.has(video.id) ? "Unmute" : "Mute"}
                    >
                      {mutedVideos.has(video.id) ? (
                        <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>

                  {/* Play Button - Center of video (only shown when paused) */}
                  <AnimatePresence>
                    {!playingVideos.has(video.id) && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            const videoElement = videoRefs.current.get(
                              video.id
                            );
                            if (videoElement) {
                              videoElement.play().catch((error) => {
                                console.error("Error playing video:", error);
                              });
                            }
                          }}
                          className="p-4 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 pointer-events-auto"
                          aria-label="Play"
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.3, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.3,
                          }}
                        >
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video Progress Slider - At the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10 bg-linear-to-t from-black/70 via-black/50 to-transparent">
                    <div className="flex items-center gap-3 text-white">
                      <span className="shrink-0 min-w-12 text-right text-xs sm:text-sm font-medium">
                        {formatTime(videoProgress[video.id] || 0)}
                      </span>
                      <div className="flex-1 relative group">
                        <input
                          type="range"
                          min="0"
                          max={videoDuration[video.id] || 0}
                          value={videoProgress[video.id] || 0}
                          onChange={(e) => {
                            const videoElement = videoRefs.current.get(
                              video.id
                            );
                            if (videoElement) {
                              const newTime = parseFloat(e.target.value);
                              videoElement.currentTime = newTime;
                              setVideoProgress((prev) => ({
                                ...prev,
                                [video.id]: newTime,
                              }));
                            }
                          }}
                          className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:h-0"
                          style={{
                            background: `linear-gradient(to right, white 0%, white ${
                              ((videoProgress[video.id] || 0) /
                                (videoDuration[video.id] || 1)) *
                              100
                            }%, rgba(255, 255, 255, 0.2) ${
                              ((videoProgress[video.id] || 0) /
                                (videoDuration[video.id] || 1)) *
                              100
                            }%, rgba(255, 255, 255, 0.2) 100%)`,
                          }}
                        />
                      </div>
                      <span className="shrink-0 min-w-12 text-xs sm:text-sm font-medium">
                        {formatTime(videoDuration[video.id] || 0)}
                      </span>
                    </div>
                  </div>

                  {/* User info and caption - At the bottom of video container */}
                  <div className="absolute bottom-12 left-0 right-0 p-4 sm:p-6">
                    {video.user && (
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/${video.user.username}`}>
                          <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border border-white/50 shrink-0 cursor-pointer">
                            <AvatarImage
                              src={avatarUrl}
                              alt={video.user.username}
                            />
                            <AvatarFallback className="text-[10px] sm:text-xs">
                              {video.user.name[0]?.toUpperCase() ||
                                video.user.username[0].toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Link
                            href={`/${video.user.username}`}
                            className="font-semibold text-white text-xs sm:text-sm truncate cursor-pointer hover:underline"
                          >
                            {video.user.username || "unknown"}
                          </Link>
                        </div>
                      </div>
                    )}
                    {video.content && (
                      <p className="text-white text-xs sm:text-sm mb-1 line-clamp-2">
                        {video.content.length > 100
                          ? `${video.content.substring(0, 100)}...`
                          : video.content}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side - Action buttons (Beside video container) */}
                <div className="flex flex-col items-center gap-4 sm:gap-6 shrink-0 mb-8">
                  <button
                    className="flex flex-col gap-1 items-center cursor-pointer text-white p-0 bg-transparent border-none outline-none hover:opacity-80 transition-opacity"
                    onClick={() => handleLike(video.id)}
                  >
                    <Heart
                      className={`h-6 w-6 sm:h-7 sm:w-7 stroke-2 ${
                        video.isLiked
                          ? "fill-red-500 text-red-500 stroke-red-500"
                          : "fill-none stroke-white"
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-normal text-white">
                      {formatNumber(video.likesCount)}
                    </span>
                  </button>

                  <Popover
                    open={
                      isCommentsDialogOpen && selectedVideo?.id === video.id
                    }
                    onOpenChange={(open) => {
                      setIsCommentsDialogOpen(open);
                      if (open) {
                        setSelectedVideo(video);
                      } else {
                        setSelectedVideo(null);
                        setReplyingTo(null);
                        setReplyText({});
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button className="flex flex-col gap-1 items-center cursor-pointer text-white p-0 bg-transparent border-none outline-none hover:opacity-80 transition-opacity">
                        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 stroke-2 fill-none stroke-white" />
                        <span className="text-xs sm:text-sm font-normal text-white">
                          {formatNumber(video.commentsCount)}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[400px] max-h-[600px] p-0 flex flex-col"
                      align="end"
                      side="left"
                    >
                      <div className="p-4 border-b">
                        <h3 className="font-semibold">Comments</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedVideo?.commentsCount || 0} comments
                        </p>
                      </div>

                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto space-y-4 p-4 max-h-[400px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {isLoadingComments ? (
                          <ReelCommentsSkeleton />
                        ) : comments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No comments yet. Be the first to comment!
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="space-y-2">
                              <div className="flex gap-3">
                                <Link href={`/${comment.user.username}`}>
                                  <Avatar className="h-8 w-8 shrink-0 cursor-pointer">
                                    <AvatarImage src={comment.user.imageUrl} />
                                    <AvatarFallback>
                                      {comment.user.name[0]?.toUpperCase() ||
                                        comment.user.username[0].toUpperCase() ||
                                        "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Link
                                      href={`/${comment.user.username}`}
                                      className="font-semibold text-sm cursor-pointer hover:underline"
                                    >
                                      {comment.user.username || "unknown"}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    {currentUser && (
                                      <button
                                        onClick={() => {
                                          setReplyingTo(
                                            replyingTo === comment.id
                                              ? null
                                              : comment.id
                                          );
                                          if (replyingTo !== comment.id) {
                                            setReplyText((prev) => ({
                                              ...prev,
                                              [comment.id]: "",
                                            }));
                                          }
                                        }}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <Reply className="h-3 w-3" />
                                        Reply
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="ml-11 pr-2">
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder={`Reply to ${
                                        comment.user.username || "user"
                                      }...`}
                                      value={replyText[comment.id] || ""}
                                      onChange={(e) =>
                                        setReplyText((prev) => ({
                                          ...prev,
                                          [comment.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSubmitComment(comment.id);
                                        }
                                      }}
                                      className="flex-1 text-sm"
                                      disabled={isSubmittingComment}
                                      autoFocus
                                    />
                                    <Button
                                      onClick={() =>
                                        handleSubmitComment(comment.id)
                                      }
                                      disabled={
                                        !replyText[comment.id]?.trim() ||
                                        isSubmittingComment
                                      }
                                      size="sm"
                                    >
                                      {isSubmittingComment
                                        ? "Posting..."
                                        : "Reply"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText((prev) => {
                                          const newReplyText = { ...prev };
                                          delete newReplyText[comment.id];
                                          return newReplyText;
                                        });
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Replies */}
                              {comment.replies &&
                                comment.replies.length > 0 && (
                                  <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="space-y-2">
                                        <div className="flex gap-3">
                                          <Link
                                            href={`/${reply.user.username}`}
                                          >
                                            <Avatar className="h-7 w-7 shrink-0 cursor-pointer">
                                              <AvatarImage
                                                src={reply.user.imageUrl}
                                              />
                                              <AvatarFallback>
                                                {reply.user.name[0]?.toUpperCase() ||
                                                  reply.user.username[0].toUpperCase() ||
                                                  "U"}
                                              </AvatarFallback>
                                            </Avatar>
                                          </Link>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Link
                                                href={`/${reply.user.username}`}
                                                className="font-semibold text-sm cursor-pointer hover:underline"
                                              >
                                                @
                                                {reply.user.username ||
                                                  "unknown"}
                                              </Link>
                                              <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(reply.createdAt)}
                                              </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">
                                              {reply.content}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      {currentUser && (
                        <div className="border-t pt-4 p-4">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmitComment();
                                }
                              }}
                              className="flex-1"
                              disabled={isSubmittingComment}
                            />
                            <Button
                              onClick={() => handleSubmitComment()}
                              disabled={
                                !newComment.trim() || isSubmittingComment
                              }
                            >
                              {isSubmittingComment ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <button className="flex flex-col gap-1 items-center cursor-pointer text-white p-0 bg-transparent border-none outline-none hover:opacity-80 transition-opacity">
                    <Share className="h-6 w-6 sm:h-7 sm:w-7 stroke-2 fill-none stroke-white" />
                  </button>

                  <button
                    className="flex flex-col gap-1 items-center cursor-pointer text-white p-0 bg-transparent border-none outline-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSave(video.id)}
                  >
                    <Bookmark
                      className={`h-6 w-6 sm:h-7 sm:w-7 stroke-2 ${
                        video.isSaved
                          ? "fill-white stroke-white"
                          : "fill-none stroke-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll Navigation Arrows - Far Right */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
          onClick={scrollToPrevious}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
          onClick={scrollToNext}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
