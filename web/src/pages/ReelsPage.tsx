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
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

type Post = {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  caption: string;
  url: string;
  type: "text" | "image" | "video";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type Comment = {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  comment: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  replies?: Comment[];
  replyCount?: number;
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
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId?: string }>();
  const [videos, setVideos] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Post | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesHasMore, setRepliesHasMore] = useState<Record<string, boolean>>(
    {}
  );
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>(
    {}
  );
  const [videoDuration, setVideoDuration] = useState<Record<string, number>>(
    {}
  );
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const getCookie = (name: string): string | null => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
          }
          return null;
        };

        const serverUrl = import.meta.env.VITE_SERVER_URL || "";
        const accessToken = getCookie("accessToken");

        if (!accessToken) {
          toast.error("Error", {
            description: "You must be logged in to view reels",
          });
          return;
        }

        // Fetch with a higher limit to ensure we get the video if it exists
        const response = await fetch(`${serverUrl}/posts?limit=100`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.posts) {
            // Filter only video posts
            const videoPosts = result.data.posts.filter(
              (post: Post) => post.type === "video"
            );

            // If we have a videoId in URL and it's not in the list, try to find it
            if (
              videoId &&
              !videoPosts.some((post: Post) => post.id === videoId)
            ) {
              // The video might not be in the first 100 posts, but we'll handle it in the scroll effect
              // For now, just log that it wasn't found in initial fetch
              console.log("Video not found in initial fetch, will retry");
            }

            setVideos(videoPosts);

            // Initialize liked and saved posts
            const likedPostIds = videoPosts
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(likedPostIds));

            const savedPostIds = videoPosts
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        } else {
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to load videos",
          });
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast.error("Error", {
          description: "Failed to load videos",
        });
      }
    };

    fetchVideos();
  }, [videoId]);

  // Handle URL parameter to scroll to specific video
  useEffect(() => {
    if (videoId && videos.length > 0 && containerRef.current) {
      // Check if the video exists in the list
      const videoExists = videos.some((v) => v.id === videoId);

      if (videoExists) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const videoElement = document.getElementById(`video-${videoId}`);
          if (videoElement) {
            videoElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Play the video after scrolling
            setTimeout(() => {
              const video = videoRefs.current.get(videoId);
              if (video) {
                video.play().catch((error) => {
                  console.error("Error playing video:", error);
                });
              }
            }, 500);
          }
        }, 100);
      } else {
        // Video not found in current list, try to fetch it
        const fetchSpecificVideo = async () => {
          const getCookie = (name: string): string | null => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
              return parts.pop()?.split(";").shift() || null;
            }
            return null;
          };

          const serverUrl = import.meta.env.VITE_SERVER_URL || "";
          const accessToken = getCookie("accessToken");

          if (!accessToken) {
            toast.error("Error", {
              description: "You must be logged in to view videos",
            });
            return;
          }

          try {
            // Fetch all posts and find the specific video
            const response = await fetch(`${serverUrl}/posts`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: "include",
            });

            if (response.ok) {
              const result = await response.json();
              if (result.data?.posts) {
                // Filter only video posts
                const videoPosts = result.data.posts.filter(
                  (post: Post) => post.type === "video"
                );

                // Check if the requested video exists
                const requestedVideo = videoPosts.find(
                  (post: Post) => post.id === videoId
                );

                if (requestedVideo) {
                  // Update videos list
                  setVideos(videoPosts);

                  // Initialize liked and saved posts
                  const likedPostIds = videoPosts
                    .filter((post: Post) => post.isLiked)
                    .map((post: Post) => post.id);
                  setLikedPosts(new Set(likedPostIds));

                  const savedPostIds = videoPosts
                    .filter((post: Post) => post.isSaved)
                    .map((post: Post) => post.id);
                  setSavedPosts(new Set(savedPostIds));

                  // Scroll to the video after state update
                  setTimeout(() => {
                    const videoElement = document.getElementById(
                      `video-${videoId}`
                    );
                    if (videoElement) {
                      videoElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });

                      setTimeout(() => {
                        const video = videoRefs.current.get(videoId);
                        if (video) {
                          video.play().catch((error) => {
                            console.error("Error playing video:", error);
                          });
                        }
                      }, 500);
                    }
                  }, 100);
                } else {
                  toast.error("Error", {
                    description: "Video not found",
                  });
                  // Navigate to reels without videoId
                  navigate("/reels", { replace: true });
                }
              }
            }
          } catch (error) {
            console.error("Error fetching video:", error);
            toast.error("Error", {
              description: "Failed to load video",
            });
          }
        };

        fetchSpecificVideo();
      }
    }
  }, [videoId, videos, navigate]);

  // Set up Intersection Observer to update URL when video is in view
  useEffect(() => {
    if (videos.length === 0) return;

    // If no videoId in URL and we have videos, set the first one
    if (!videoId && videos.length > 0) {
      navigate(`/reels/${videos[0].id}`, { replace: true });
    }

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const videoId = entry.target.getAttribute("data-video-id");
            if (
              videoId &&
              videoId !== window.location.pathname.split("/").pop()
            ) {
              navigate(`/reels/${videoId}`, { replace: true });

              // Play the video
              const video = videoRefs.current.get(videoId);
              if (video) {
                video.play().catch((error) => {
                  console.error("Error playing video:", error);
                });
              }
            }
          }
        });
      },
      {
        threshold: [0.5],
        rootMargin: "0px",
      }
    );

    // Observe all video containers
    videos.forEach((video) => {
      const element = document.getElementById(`video-${video.id}`);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos, navigate, videoId]);

  // Auto-play video when it comes into view
  useEffect(() => {
    if (videoId) {
      const videoElement = videoRefs.current.get(videoId);
      if (videoElement) {
        // Set muted state based on state
        videoElement.muted = mutedVideos.has(videoId);
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
        setPlayingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.add(videoId);
          return newSet;
        });
      }
    }

    // Pause other videos
    videoRefs.current.forEach((videoElement, id) => {
      if (id !== videoId) {
        videoElement.pause();
        setPlayingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    });
  }, [videoId, mutedVideos]);

  const handleLike = async (postId: string) => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to like posts",
      });
      return;
    }

    const isLiked = likedPosts.has(postId);
    const serverUrl = import.meta.env.VITE_SERVER_URL || "";

    // Get current likes count for revert
    const currentVideo = videos.find((v) => v.id === postId);
    const previousLikesCount = currentVideo?.likesCount || 0;

    // Optimistic update
    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setVideos((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: Math.max(0, post.likesCount - 1) }
            : post
        )
      );
    } else {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setVideos((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: post.likesCount + 1 }
            : post
        )
      );
    }

    try {
      if (isLiked) {
        const response = await fetch(`${serverUrl}/posts/${postId}/like`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Revert on error
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
          });
          setVideos((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likesCount: previousLikesCount }
                : post
            )
          );
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to unlike post",
          });
        }
      } else {
        const response = await fetch(`${serverUrl}/posts/${postId}/like`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Revert on error
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          setVideos((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likesCount: previousLikesCount }
                : post
            )
          );
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to like post",
          });
        }
      }
    } catch (error) {
      // Revert on error
      if (isLiked) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
        setVideos((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: previousLikesCount }
              : post
          )
        );
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setVideos((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: previousLikesCount }
              : post
          )
        );
      }
      console.error("Error liking post:", error);
      toast.error("Error", {
        description: "Failed to like post",
      });
    }
  };

  const handleSave = async (postId: string) => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to save posts",
      });
      return;
    }

    const isSaved = savedPosts.has(postId);
    const serverUrl = import.meta.env.VITE_SERVER_URL || "";

    // Optimistic update
    if (isSaved) {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
    }

    try {
      if (isSaved) {
        const response = await fetch(`${serverUrl}/posts/${postId}/saved`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Revert on error
          setSavedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
          });
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to unsave post",
          });
        }
      } else {
        const response = await fetch(`${serverUrl}/posts/${postId}/saved`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Revert on error
          setSavedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to save post",
          });
        }
      }
    } catch (error) {
      // Revert on error
      if (isSaved) {
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
      } else {
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
      console.error("Error saving post:", error);
      toast.error("Error", {
        description: "Failed to save post",
      });
    }
  };

  // Fetch comments when dialog opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedVideo?.id || !isCommentsDialogOpen) {
        setComments([]);
        return;
      }

      const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop()?.split(";").shift() || null;
        }
        return null;
      };

      const serverUrl = import.meta.env.VITE_SERVER_URL || "";
      const accessToken = getCookie("accessToken");
      if (!accessToken) {
        return;
      }

      try {
        setIsLoadingComments(true);
        const response = await fetch(
          `${serverUrl}/posts/${selectedVideo.id}/comments`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data?.comments) {
            setComments(result.data.comments);
            // Reset loaded replies when fetching fresh comments
            setLoadedReplies(new Set());
            setRepliesHasMore({});
            setReplyingTo(null);
            setReplyText({});
          }
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

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const serverUrl = import.meta.env.VITE_SERVER_URL || "";
    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to comment",
      });
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await fetch(
        `${serverUrl}/posts/${selectedVideo.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            comment: commentText,
            parentId: parentId || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data?.comment) {
          if (parentId) {
            setComments((prev) =>
              prev.map((comment) => {
                if (comment.id === parentId) {
                  const existingReplies = comment.replies || [];
                  return {
                    ...comment,
                    replies: [...existingReplies, result.data.comment],
                    replyCount: (comment.replyCount || 0) + 1,
                  };
                }
                return comment;
              })
            );
            setReplyText((prev) => ({ ...prev, [parentId]: "" }));
            setReplyingTo(null);
          } else {
            setComments((prev) => [result.data.comment, ...prev]);
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
      } else {
        const error = await response.json();
        toast.error("Error", {
          description: error.message || "Failed to post comment",
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error", {
        description: "Failed to post comment",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLoadReplies = async (
    commentId: string,
    skip: number = 0,
    limit: number = 2
  ) => {
    if (!selectedVideo?.id) {
      return;
    }

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const serverUrl = import.meta.env.VITE_SERVER_URL || "";
    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to view replies",
      });
      return;
    }

    try {
      setLoadingReplies((prev) => new Set(prev).add(commentId));
      const response = await fetch(
        `${serverUrl}/posts/${selectedVideo.id}/comments/${commentId}/replies?skip=${skip}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data?.replies) {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.id === commentId) {
                const existingReplies = comment.replies || [];
                const newReplies =
                  skip === 0
                    ? result.data.replies
                    : [...existingReplies, ...result.data.replies];

                return {
                  ...comment,
                  replies: newReplies,
                  replyCount: undefined,
                };
              }
              return comment;
            })
          );

          if (result.data.hasMore !== undefined) {
            setRepliesHasMore((prev) => ({
              ...prev,
              [commentId]: result.data.hasMore,
            }));
          }

          setLoadedReplies((prev) => new Set(prev).add(commentId));
        }
      } else {
        const error = await response.json();
        toast.error("Error", {
          description: error.message || "Failed to load replies",
        });
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Error", {
        description: "Failed to load replies",
      });
    } finally {
      setLoadingReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleLoadMoreReplies = async (commentId: string) => {
    const currentReplies =
      comments.find((c) => c.id === commentId)?.replies || [];
    const skip = currentReplies.length;
    await handleLoadReplies(commentId, skip, 10);
  };

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
    if (containerRef.current) {
      const currentIndex = videos.findIndex((v) => v.id === videoId);
      const nextIndex = currentIndex < videos.length - 1 ? currentIndex + 1 : 0;
      const nextVideo = videos[nextIndex];
      if (nextVideo) {
        navigate(`/reels/${nextVideo.id}`, { replace: true });
        const element = document.getElementById(`video-${nextVideo.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  const scrollToPrevious = () => {
    if (containerRef.current) {
      const currentIndex = videos.findIndex((v) => v.id === videoId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
      const prevVideo = videos[prevIndex];
      if (prevVideo) {
        navigate(`/reels/${prevVideo.id}`, { replace: true });
        const element = document.getElementById(`video-${prevVideo.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  return (
    <div className="relative flex-1 h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth max-w-full mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {videos.map((video) => (
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
                      // Set initial muted state
                      el.muted = mutedVideos.has(video.id);
                      // Set up timeupdate listener
                      el.addEventListener("timeupdate", () => {
                        setVideoProgress((prev) => ({
                          ...prev,
                          [video.id]: el.currentTime,
                        }));
                      });
                      // Set up loadedmetadata listener
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
                  src={video.url}
                  className="h-full w-full object-contain rounded-lg border border-white/10 cursor-pointer"
                  loop
                  muted={mutedVideos.has(video.id)}
                  playsInline
                  onClick={() => {
                    const videoElement = videoRefs.current.get(video.id);
                    if (videoElement) {
                      const isPlaying = playingVideos.has(video.id);
                      if (isPlaying) {
                        videoElement.pause();
                      } else {
                        videoElement.play().catch((error) => {
                          console.error("Error playing video:", error);
                        });
                      }
                    }
                  }}
                  onPlay={() => {
                    // Update playing state
                    setPlayingVideos((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(video.id);
                      return newSet;
                    });
                    // Pause other videos when this one plays
                    videoRefs.current.forEach((v, id) => {
                      if (id !== video.id) {
                        v.pause();
                        setPlayingVideos((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(id);
                          return newSet;
                        });
                      }
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
                          const videoElement = videoRefs.current.get(video.id);
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
                          const videoElement = videoRefs.current.get(video.id);
                          if (videoElement) {
                            const newTime = parseFloat(e.target.value);
                            videoElement.currentTime = newTime;
                            setVideoProgress((prev) => ({
                              ...prev,
                              [video.id]: newTime,
                            }));
                          }
                        }}
                        className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer slider-thumb"
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
                      <Avatar
                        className="h-6 w-6 sm:h-7 sm:w-7 border border-white/50 shrink-0 cursor-pointer"
                        onClick={() => {
                          if (video.user?.username) {
                            navigate(`/${video.user.username}`);
                          }
                        }}
                      >
                        <AvatarImage
                          src={video.user.profileImage || ""}
                          alt={video.user.username || ""}
                        />
                        <AvatarFallback className="text-[10px] sm:text-xs">
                          {video.user.firstName?.[0] ||
                            video.user.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <p
                          className="font-semibold text-white text-xs sm:text-sm truncate cursor-pointer hover:underline"
                          onClick={() => {
                            if (video.user?.username) {
                              navigate(`/${video.user.username}`);
                            }
                          }}
                        >
                          @{video.user.username || "unknown"}
                        </p>
                        <span className="text-white/60 text-xs">·</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-xs font-semibold text-white hover:bg-white/20 shrink-0"
                          onClick={async () => {
                            if (!video.user?.username || !video.user?.id)
                              return;
                            const getCookie = (name: string): string | null => {
                              const value = `; ${document.cookie}`;
                              const parts = value.split(`; ${name}=`);
                              if (parts.length === 2) {
                                return parts.pop()?.split(";").shift() || null;
                              }
                              return null;
                            };

                            const accessToken = getCookie("accessToken");
                            if (!accessToken) {
                              toast.error("Error", {
                                description:
                                  "You must be logged in to follow users",
                              });
                              return;
                            }

                            const serverUrl =
                              import.meta.env.VITE_SERVER_URL || "";
                            const userId = video.user.id;
                            const username = video.user.username;
                            const isCurrentlyFollowing =
                              followingUsers.has(userId);

                            // Optimistic update
                            if (isCurrentlyFollowing) {
                              setFollowingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(userId);
                                return newSet;
                              });
                            } else {
                              setFollowingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.add(userId);
                                return newSet;
                              });
                            }

                            try {
                              if (isCurrentlyFollowing) {
                                const response = await fetch(
                                  `${serverUrl}/users/${username}/follow`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${accessToken}`,
                                    },
                                    credentials: "include",
                                  }
                                );

                                if (!response.ok) {
                                  // Revert on error
                                  setFollowingUsers((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.add(userId);
                                    return newSet;
                                  });
                                  const error = await response.json();
                                  toast.error("Error", {
                                    description:
                                      error.message ||
                                      "Failed to unfollow user",
                                  });
                                }
                              } else {
                                const response = await fetch(
                                  `${serverUrl}/users/${username}/follow`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${accessToken}`,
                                    },
                                    credentials: "include",
                                  }
                                );

                                if (!response.ok) {
                                  // Revert on error
                                  setFollowingUsers((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(userId);
                                    return newSet;
                                  });
                                  const error = await response.json();
                                  toast.error("Error", {
                                    description:
                                      error.message || "Failed to follow user",
                                  });
                                }
                              }
                            } catch (error) {
                              // Revert on error
                              if (isCurrentlyFollowing) {
                                setFollowingUsers((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.add(userId);
                                  return newSet;
                                });
                              } else {
                                setFollowingUsers((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(userId);
                                  return newSet;
                                });
                              }
                              console.error("Error following user:", error);
                              toast.error("Error", {
                                description: "Failed to follow user",
                              });
                            }
                          }}
                        >
                          {video.user && followingUsers.has(video.user.id)
                            ? "Following"
                            : "Follow"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {video.caption && (
                    <p className="text-white text-xs sm:text-sm mb-1 wrap-break-word line-clamp-2">
                      {video.caption.length > 100
                        ? `${video.caption.substring(0, 100)}...`
                        : video.caption}
                      {video.caption.length > 100 && (
                        <span className="text-white/70"> more</span>
                      )}
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
                      likedPosts.has(video.id)
                        ? "fill-red-500 text-red-500 stroke-red-500"
                        : "fill-none stroke-white"
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-normal text-white">
                    Likes
                  </span>
                </button>

                <Popover
                  open={isCommentsDialogOpen && selectedVideo?.id === video.id}
                  onOpenChange={(open) => {
                    setIsCommentsDialogOpen(open);
                    if (open) {
                      setSelectedVideo(video);
                    } else {
                      setSelectedVideo(null);
                      // Reset reply states when popover closes
                      setLoadedReplies(new Set());
                      setRepliesHasMore({});
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
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No comments yet. Be the first to comment!
                        </div>
                      ) : (
                        comments.map((comment) => {
                          if (!comment.user) {
                            return null;
                          }
                          return (
                            <div key={comment.id} className="space-y-2">
                              <div className="flex gap-3">
                                <Avatar
                                  className="h-8 w-8 shrink-0 cursor-pointer"
                                  onClick={() => {
                                    if (comment.user?.username) {
                                      navigate(`/${comment.user.username}`);
                                    }
                                  }}
                                >
                                  <AvatarImage
                                    src={comment.user.profileImage || ""}
                                    alt={comment.user.username || ""}
                                  />
                                  <AvatarFallback>
                                    {comment.user.firstName?.[0]?.toUpperCase() ||
                                      comment.user.username?.[0]?.toUpperCase() ||
                                      "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="font-semibold text-sm cursor-pointer hover:underline"
                                      onClick={() => {
                                        if (comment.user?.username) {
                                          navigate(`/${comment.user.username}`);
                                        }
                                      }}
                                    >
                                      @{comment.user.username || "unknown"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                    {comment.comment}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
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
                                    {comment.replyCount !== undefined &&
                                      comment.replyCount > 0 &&
                                      !loadedReplies.has(comment.id) && (
                                        <button
                                          onClick={() =>
                                            handleLoadReplies(comment.id)
                                          }
                                          disabled={loadingReplies.has(
                                            comment.id
                                          )}
                                          className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                        >
                                          {loadingReplies.has(comment.id)
                                            ? "Loading..."
                                            : `View ${comment.replyCount} ${
                                                comment.replyCount === 1
                                                  ? "reply"
                                                  : "replies"
                                              }`}
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
                                      placeholder={`Reply to @${
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
                              {loadedReplies.has(comment.id) &&
                                comment.replies &&
                                comment.replies.length > 0 && (
                                  <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                                    {(() => {
                                      const hasMore =
                                        repliesHasMore[comment.id] === true;
                                      const shouldShowAll =
                                        !hasMore ||
                                        comment.replies!.length <= 2;
                                      return shouldShowAll
                                        ? comment.replies!
                                        : comment.replies!.slice(0, 2);
                                    })().map((reply) => {
                                      if (!reply.user) {
                                        return null;
                                      }
                                      return (
                                        <div
                                          key={reply.id}
                                          className="space-y-2"
                                        >
                                          <div className="flex gap-3">
                                            <Avatar
                                              className="h-7 w-7 shrink-0 cursor-pointer"
                                              onClick={() => {
                                                if (reply.user?.username) {
                                                  navigate(
                                                    `/${reply.user.username}`
                                                  );
                                                }
                                              }}
                                            >
                                              <AvatarImage
                                                src={
                                                  reply.user.profileImage || ""
                                                }
                                                alt={reply.user.username || ""}
                                              />
                                              <AvatarFallback>
                                                {reply.user.firstName?.[0]?.toUpperCase() ||
                                                  reply.user.username?.[0]?.toUpperCase() ||
                                                  "U"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span
                                                  className="font-semibold text-sm cursor-pointer hover:underline"
                                                  onClick={() => {
                                                    if (reply.user?.username) {
                                                      navigate(
                                                        `/${reply.user.username}`
                                                      );
                                                    }
                                                  }}
                                                >
                                                  @
                                                  {reply.user.username ||
                                                    "unknown"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {formatTimeAgo(
                                                    reply.createdAt
                                                  )}
                                                </span>
                                              </div>
                                              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                                {reply.comment}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {repliesHasMore[comment.id] && (
                                      <button
                                        onClick={() =>
                                          handleLoadMoreReplies(comment.id)
                                        }
                                        disabled={loadingReplies.has(
                                          comment.id
                                        )}
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                      >
                                        {loadingReplies.has(comment.id)
                                          ? "Loading..."
                                          : `View more replies`}
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Comment Input */}
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
                          disabled={!newComment.trim() || isSubmittingComment}
                        >
                          {isSubmittingComment ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    </div>
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
                      savedPosts.has(video.id)
                        ? "fill-white stroke-white"
                        : "fill-none stroke-white"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
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

      {/* Messages Button - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          className="h-auto px-4 py-2 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 rounded-lg flex items-center gap-2"
          onClick={() => navigate("/messages")}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Messages</span>
          <div className="flex -space-x-2 ml-1">
            {/* Mock profile pictures for messages */}
            {[1, 2, 3].map((i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-white/50">
                <AvatarFallback className="text-[10px] bg-white/20 text-white">
                  {String.fromCharCode(65 + i)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Button>
      </div>
    </div>
  );
}
