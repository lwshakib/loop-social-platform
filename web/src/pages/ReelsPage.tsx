import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
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
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

export default function ReelsPage() {
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId?: string }>();
  const [videos, setVideos] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
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
            let videoPosts = result.data.posts.filter(
              (post: Post) => post.type === "video"
            );

            // If we have a videoId in URL and it's not in the list, try to find it
            if (videoId && !videoPosts.some((post: Post) => post.id === videoId)) {
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
      } finally {
        setIsLoading(false);
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
            videoElement.scrollIntoView({ behavior: "smooth", block: "center" });
            
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
                    const videoElement = document.getElementById(`video-${videoId}`);
                    if (videoElement) {
                      videoElement.scrollIntoView({ behavior: "smooth", block: "center" });
                      
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
            if (videoId && videoId !== window.location.pathname.split("/").pop()) {
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
      const video = videoRefs.current.get(videoId);
      if (video) {
        video.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    }

    // Pause other videos
    videoRefs.current.forEach((video, id) => {
      if (id !== videoId) {
        video.pause();
      }
    });
  }, [videoId]);

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
          post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
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

  return (
    <div
      ref={containerRef}
      className="flex-1 h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth max-w-full mx-auto"
    >
      {videos.map((video) => (
        <div
          key={video.id}
          id={`video-${video.id}`}
          data-video-id={video.id}
          className="h-screen w-full snap-start snap-always flex items-center justify-center bg-background relative"
        >
          {/* Video Container - Full height with 9:16 aspect ratio */}
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="h-full w-full max-w-[calc(100vh*9/16)] flex items-center justify-center relative">
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(video.id, el);
                  } else {
                    videoRefs.current.delete(video.id);
                  }
                }}
                src={video.url}
                className="h-full w-full object-cover"
                style={{ aspectRatio: "9/16" }}
                loop
                muted
                playsInline
                onPlay={() => {
                  // Pause other videos when this one plays
                  videoRefs.current.forEach((v, id) => {
                    if (id !== video.id) {
                      v.pause();
                    }
                  });
                }}
              />

              {/* Overlay with user info, caption, and actions - Inside video */}
              <div className="absolute inset-0 flex">
                {/* Left side - User info and caption */}
                <div className="flex-1 flex flex-col justify-end p-4 sm:p-6 pb-20 sm:pb-24">
                  {video.user && (
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage
                          src={video.user.profileImage || ""}
                          alt={video.user.username || ""}
                        />
                        <AvatarFallback>
                          {video.user.firstName?.[0] || video.user.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white text-sm sm:text-base">
                          @{video.user.username || "unknown"}
                        </p>
                        <p className="text-white/80 text-xs sm:text-sm">
                          {formatTimeAgo(video.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {video.caption && (
                    <p className="text-white text-sm sm:text-base mb-2 wrap-break-word">
                      {video.caption}
                    </p>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col justify-end items-center gap-4 sm:gap-6 p-4 sm:p-6 pb-20 sm:pb-24">
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col gap-1 h-auto text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm rounded-full p-2"
                onClick={() => handleLike(video.id)}
              >
                <Heart
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    likedPosts.has(video.id)
                      ? "fill-red-500 text-red-500"
                      : ""
                  }`}
                />
                <span className="text-xs sm:text-sm font-semibold">
                  {video.likesCount}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col gap-1 h-auto text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm rounded-full p-2"
              >
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                <span className="text-xs sm:text-sm font-semibold">
                  {video.commentsCount}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col gap-1 h-auto text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm rounded-full p-2"
                onClick={() => handleSave(video.id)}
              >
                <Bookmark
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    savedPosts.has(video.id)
                      ? "fill-white text-white"
                      : ""
                  }`}
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col gap-1 h-auto text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm rounded-full p-2"
              >
                <Share className="h-6 w-6 sm:h-7 sm:w-7" />
              </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
