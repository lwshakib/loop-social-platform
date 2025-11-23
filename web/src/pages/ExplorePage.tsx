import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import VideoPlayer from "@/components/VideoPlayer";
import { Bookmark, Heart, MessageCircle, Play, Reply, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

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

type Post = {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    surName: string;
    username: string;
    profileImage: string;
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

export default function ExplorePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>(
    {}
  );
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesHasMore, setRepliesHasMore] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [repliesTotal, setRepliesTotal] = useState<{
    [commentId: string]: number;
  }>({});

  // Track screen size for dialog dimensions
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate media aspect ratio when post is selected
  useEffect(() => {
    if (selectedPost?.url) {
      if (selectedPost.type === "video") {
        const video = document.createElement("video");
        video.src = selectedPost.url;
        video.onloadedmetadata = () => {
          const aspectRatio = video.videoWidth / video.videoHeight;
          setMediaAspectRatio(aspectRatio);
        };
      } else {
        const img = new Image();
        img.src = selectedPost.url;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          setMediaAspectRatio(aspectRatio);
        };
      }
    } else {
      setMediaAspectRatio(null);
    }
  }, [selectedPost]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
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

      try {
        setIsLoading(true);
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${serverUrl}/posts?limit=50`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.posts) {
            setPosts(result.data.posts);
            // Initialize likedPosts and savedPosts state
            const likedPostIds = result.data.posts
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(likedPostIds));
            const savedPostIds = result.data.posts
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        } else {
          toast.error("Error", {
            description: "Failed to load posts",
          });
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Error", {
          description: "Failed to load posts",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Fetch comments when post dialog opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedPost?.id || !isPostDialogOpen) {
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

      const getServerUrl = () => {
        return import.meta.env.VITE_SERVER_URL || "";
      };

      const accessToken = getCookie("accessToken");
      if (!accessToken) {
        return;
      }

      try {
        setIsLoadingComments(true);
        const serverUrl = getServerUrl();
        const response = await fetch(
          `${serverUrl}/posts/${selectedPost.id}/comments`,
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
            setLoadedReplies(new Set());
            setRepliesHasMore({});
            setRepliesTotal({});
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
  }, [selectedPost?.id, isPostDialogOpen]);

  const handleSubmitComment = async (parentId?: string) => {
    const commentText = parentId
      ? replyText[parentId]?.trim()
      : newComment.trim();

    if (!commentText || !selectedPost?.id) {
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

    const getServerUrl = () => {
      return import.meta.env.VITE_SERVER_URL || "";
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to comment",
      });
      return;
    }

    try {
      setIsSubmittingComment(true);
      const serverUrl = getServerUrl();
      const response = await fetch(
        `${serverUrl}/posts/${selectedPost.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            comment: commentText,
            ...(parentId ? { parentId } : {}),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          if (parentId) {
            setComments((prev) =>
              prev.map((comment) => {
                if (comment.id === parentId) {
                  if (loadedReplies.has(parentId)) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), result.data],
                    };
                  } else {
                    return {
                      ...comment,
                      replyCount: (comment.replyCount || 0) + 1,
                    };
                  }
                }
                return comment;
              })
            );
            setReplyText((prev) => {
              const newReplyText = { ...prev };
              delete newReplyText[parentId];
              return newReplyText;
            });
            setReplyingTo(null);
          } else {
            setComments((prev) => [result.data, ...prev]);
            setNewComment("");
          }
          setPosts((prev) =>
            prev.map((post) =>
              post.id === selectedPost.id
                ? { ...post, commentsCount: post.commentsCount + 1 }
                : post
            )
          );
          setSelectedPost((prev) =>
            prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
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

  const handleSave = async (postId: string) => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const getServerUrl = () => {
      return import.meta.env.VITE_SERVER_URL || "";
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to save posts",
      });
      return;
    }

    const isSaved = savedPosts.has(postId);
    const serverUrl = getServerUrl();

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

  const handleLoadReplies = async (
    commentId: string,
    skip: number = 0,
    limit: number = 2
  ) => {
    if (!selectedPost?.id) {
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

    const getServerUrl = () => {
      return import.meta.env.VITE_SERVER_URL || "";
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to view replies",
      });
      return;
    }

    try {
      setLoadingReplies((prev) => new Set(prev).add(commentId));
      const serverUrl = getServerUrl();
      const response = await fetch(
        `${serverUrl}/posts/${selectedPost.id}/comments/${commentId}/replies?skip=${skip}&limit=${limit}`,
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
          if (result.data.total !== undefined) {
            setRepliesTotal((prev) => ({
              ...prev,
              [commentId]: result.data.total,
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

  const handleLike = async (postId: string) => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const getServerUrl = () => {
      return import.meta.env.VITE_SERVER_URL || "";
    };

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      toast.error("Error", {
        description: "You must be logged in to like posts",
      });
      return;
    }

    const isLiked = likedPosts.has(postId);
    const serverUrl = getServerUrl();
    const currentPost = posts.find((p) => p.id === postId);
    const previousLikesCount = currentPost?.likesCount || 0;
    const selectedPostLikesCount =
      selectedPost?.id === postId ? selectedPost.likesCount : null;

    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: Math.max(0, post.likesCount - 1) }
            : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likesCount: Math.max(0, prev.likesCount - 1),
              }
            : null
        );
      }
    } else {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: post.likesCount + 1 }
            : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev ? { ...prev, likesCount: prev.likesCount + 1 } : null
        );
      }
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
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
          });
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likesCount: previousLikesCount }
                : post
            )
          );
          if (selectedPost?.id === postId && selectedPostLikesCount !== null) {
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    likesCount: selectedPostLikesCount,
                  }
                : null
            );
          }
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
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likesCount: previousLikesCount }
                : post
            )
          );
          if (selectedPost?.id === postId && selectedPostLikesCount !== null) {
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    likesCount: selectedPostLikesCount,
                  }
                : null
            );
          }
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to like post",
          });
        }
      }
    } catch (error) {
      if (isLiked) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: previousLikesCount }
              : post
          )
        );
        if (selectedPost?.id === postId && selectedPostLikesCount !== null) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: selectedPostLikesCount,
                }
              : null
          );
        }
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: previousLikesCount }
              : post
          )
        );
        if (selectedPost?.id === postId && selectedPostLikesCount !== null) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: selectedPostLikesCount,
                }
              : null
          );
        }
      }
      console.error("Error liking post:", error);
      toast.error("Error", {
        description: "Failed to like post",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-sm">
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setSelectedPost(post);
                  setIsPostDialogOpen(true);
                  if (post.isLiked) {
                    setLikedPosts((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(post.id);
                      return newSet;
                    });
                  }
                  if (post.isSaved) {
                    setSavedPosts((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(post.id);
                      return newSet;
                    });
                  }
                }}
              >
                {post.url ? (
                  <>
                    {post.type === "video" ? (
                      <div className="relative w-full h-full">
                        <video
                          src={post.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white opacity-80" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={post.url}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                        {post.caption || "Post"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay on hover - show engagement stats */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-4 sm:gap-6 text-white">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                      <span className="text-sm sm:text-base font-semibold">
                        {post.likesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                      <span className="text-sm sm:text-base font-semibold">
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video indicator */}
                {post.type === "video" && (
                  <div className="absolute top-2 right-2">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Dialog - Similar to ProfilePage */}
      <Dialog
        open={isPostDialogOpen}
        onOpenChange={(open) => {
          setIsPostDialogOpen(open);
          if (!open) {
            if (selectedPost?.type === "video") {
              const videoElement = document.querySelector(
                `[data-video-id="${selectedPost.id}"] video`
              ) as HTMLVideoElement;
              if (videoElement) {
                videoElement.pause();
              }
            }
            setSelectedPost(null);
            setMediaAspectRatio(null);
            setLoadedReplies(new Set());
            setRepliesHasMore({});
            setRepliesTotal({});
            setReplyingTo(null);
            setReplyText({});
          }
        }}
      >
        <DialogContent
          className="p-0 gap-0 overflow-hidden z-80"
          overlayClassName="z-75"
          showCloseButton={false}
          style={(() => {
            const baseWidth = isLargeScreen ? 70 : 95;
            const baseHeight = isLargeScreen ? 70 : 95;

            if (mediaAspectRatio && selectedPost?.url) {
              const maxWidth = (window.innerWidth * baseWidth) / 100;
              const maxHeight = (window.innerHeight * baseHeight) / 100;

              let width = maxWidth;
              let height = maxHeight;

              if (mediaAspectRatio > 1) {
                height = Math.min(maxHeight, maxWidth / mediaAspectRatio);
                width = height * mediaAspectRatio;
                width = width + width * 0.6;
              } else if (mediaAspectRatio < 1) {
                width = Math.min(maxWidth, maxHeight * mediaAspectRatio);
                height = width / mediaAspectRatio;
                width = width + width * 0.6;
              } else {
                const size = Math.min(maxWidth, maxHeight);
                width = size + size * 0.6;
                height = size;
              }

              return {
                width: `${Math.min(width, window.innerWidth * 0.95)}px`,
                height: `${Math.min(height, window.innerHeight * 0.95)}px`,
                maxWidth: "none",
                maxHeight: "95vh",
              } as React.CSSProperties;
            }

            return {
              width: isLargeScreen ? "70vw" : "95vw",
              height: isLargeScreen ? "70vh" : "95vh",
              maxWidth: "none",
              maxHeight: "95vh",
            } as React.CSSProperties;
          })()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              View post details, comments, and interactions
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Media Section */}
              <div className="relative w-full md:w-2/5 bg-black flex items-center justify-center overflow-hidden h-full max-h-full p-0 m-0">
                {selectedPost.url ? (
                  selectedPost.type === "video" ? (
                    <VideoPlayer
                      src={selectedPost.url}
                      videoId={selectedPost.id}
                      containerClassName="w-full h-full"
                      className="w-full h-full"
                      aspectRatio="9/16"
                    />
                  ) : (
                    <img
                      src={selectedPost.url}
                      alt="Post"
                      className="object-contain"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        width: "auto",
                        height: "auto",
                      }}
                    />
                  )
                ) : (
                  <div className="text-center p-8 text-white">
                    <p className="text-sm">{selectedPost.caption || "Post"}</p>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="w-full md:w-3/5 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        selectedPost.user.profileImage ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.user.username}`
                      }
                    />
                    <AvatarFallback>
                      {selectedPost.user.firstName[0]?.toUpperCase() ||
                        selectedPost.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => {
                        setIsPostDialogOpen(false);
                        navigate(`/@${selectedPost.user.username}`);
                      }}
                      className="font-semibold text-sm hover:underline"
                    >
                      @{selectedPost.user.username}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPostDialogOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Caption */}
                {selectedPost.caption && (
                  <div className="p-4 border-b">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">
                        {selectedPost.caption}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(selectedPost.createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(selectedPost.id)
                            ? "text-red-500"
                            : "hover:text-red-500"
                        }`}
                        onClick={() => handleLike(selectedPost.id)}
                      >
                        <Heart
                          className={`h-6 w-6 ${
                            likedPosts.has(selectedPost.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        <span className="text-sm font-semibold">
                          {selectedPost.likesCount || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-primary transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-sm font-semibold">
                          {selectedPost.commentsCount || 0}
                        </span>
                      </button>
                    </div>
                    <button
                      className={`transition-colors ${
                        savedPosts.has(selectedPost.id)
                          ? "text-yellow-500"
                          : "hover:text-yellow-500"
                      }`}
                      onClick={() => handleSave(selectedPost.id)}
                    >
                      <Bookmark
                        className={`h-6 w-6 ${
                          savedPosts.has(selectedPost.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto min-h-0 border-t">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {comments.map((comment) => {
                        if (!comment.user) {
                          return null;
                        }
                        return (
                          <div key={comment.id} className="space-y-2">
                            {/* Main Comment */}
                            <div className="flex gap-3 hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={
                                    comment.user.profileImage ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                      comment.user.username || "user"
                                    }`
                                  }
                                  alt={comment.user.username || "User"}
                                />
                                <AvatarFallback>
                                  {comment.user.firstName?.[0]?.toUpperCase() ||
                                    comment.user.username?.[0]?.toUpperCase() ||
                                    "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => {
                                      setIsPostDialogOpen(false);
                                      navigate(
                                        `/@${comment.user?.username || ""}`
                                      );
                                    }}
                                    className="font-semibold text-sm hover:underline"
                                  >
                                    @{comment.user.username || "unknown"}
                                  </button>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                  {comment.comment}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
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
                                          : `${comment.replyCount} ${
                                              comment.replyCount === 1
                                                ? "Reply"
                                                : "Replies"
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
                                    <X className="h-4 w-4" />
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
                                      !hasMore || comment.replies.length <= 2;
                                    return shouldShowAll
                                      ? comment.replies
                                      : comment.replies.slice(0, 2);
                                  })().map((reply) => {
                                    if (!reply.user) {
                                      return null;
                                    }
                                    return (
                                      <div key={reply.id} className="space-y-2">
                                        <div className="flex gap-3 hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors">
                                          <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarImage
                                              src={
                                                reply.user.profileImage ||
                                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                                  reply.user.username || "user"
                                                }`
                                              }
                                              alt={
                                                reply.user.username || "User"
                                              }
                                            />
                                            <AvatarFallback>
                                              {reply.user.firstName?.[0]?.toUpperCase() ||
                                                reply.user.username?.[0]?.toUpperCase() ||
                                                "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <button
                                                onClick={() => {
                                                  setIsPostDialogOpen(false);
                                                  navigate(
                                                    `/@${
                                                      reply.user?.username || ""
                                                    }`
                                                  );
                                                }}
                                                className="font-semibold text-sm hover:underline"
                                              >
                                                @
                                                {reply.user.username ||
                                                  "unknown"}
                                              </button>
                                              <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(reply.createdAt)}
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

                                  {/* Show More Replies Button */}
                                  {repliesHasMore[comment.id] === true && (
                                    <button
                                      onClick={() =>
                                        handleLoadMoreReplies(comment.id)
                                      }
                                      disabled={loadingReplies.has(comment.id)}
                                      className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 mt-2"
                                    >
                                      {loadingReplies.has(comment.id)
                                        ? "Loading..."
                                        : repliesTotal[comment.id] &&
                                          comment.replies
                                        ? `View ${
                                            repliesTotal[comment.id] -
                                            comment.replies.length
                                          } more ${
                                            repliesTotal[comment.id] -
                                              comment.replies.length ===
                                            1
                                              ? "reply"
                                              : "replies"
                                          }`
                                        : "View more replies"}
                                    </button>
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t">
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
                      size="sm"
                    >
                      {isSubmittingComment ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
