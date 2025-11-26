import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { Input } from "@/components/ui/input";
import VideoPlayer from "@/components/VideoPlayer";
import { Bookmark, Heart, MessageCircle, Play, Reply } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { UserData } from "../store/userStore";
import { getAccessToken, getServerUrl } from "../utils/auth";

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

const formatNumber = (value?: number) => {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
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

interface ExplorePageProps {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
}

export default function ExplorePage({
  onNavigate,
  onSignOut,
  userData,
}: ExplorePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const handleReplyToggle = (commentId: string) => {
    setReplyingTo((prev) => (prev === commentId ? null : commentId));
    if (replyingTo !== commentId) {
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    }
  };

  const handleReplyTextChange = (commentId: string, value: string) => {
    setReplyText((prev) => ({ ...prev, [commentId]: value }));
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsPostDialogOpen(open);
    if (!open) {
      setSelectedPost(null);
      setComments([]);
      setReplyingTo(null);
      setReplyText({});
      setNewComment("");
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
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

  // Track screen size for dialog dimensions
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);


  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      const serverUrl = getServerUrl();
      const accessToken = getAccessToken();

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

      const accessToken = getAccessToken();
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

    const accessToken = getAccessToken();
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
    const accessToken = getAccessToken();
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

    const accessToken = getAccessToken();
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
    const accessToken = getAccessToken();
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
    <Layout
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      userData={userData}
      currentPage="explore"
    >
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
        <PostDetailDialog
          open={isPostDialogOpen}
          onOpenChange={handleDialogOpenChange}
          post={selectedPost}
          likedPosts={likedPosts}
          savedPosts={savedPosts}
          comments={comments}
          isLoadingComments={isLoadingComments}
          loadingReplies={loadingReplies}
          repliesHasMore={repliesHasMore}
          replyingTo={replyingTo}
          replyText={replyText}
          newComment={newComment}
          isSubmittingComment={isSubmittingComment}
          formatTimeAgo={formatTimeAgo}
          formatNumber={formatNumber}
          onLike={handleLike}
          onSave={handleSave}
          onSubmitComment={handleSubmitComment}
          onReplyToggle={handleReplyToggle}
          onReplyTextChange={handleReplyTextChange}
          onLoadReplies={handleLoadReplies}
          onLoadMoreReplies={handleLoadMoreReplies}
          onNewCommentChange={setNewComment}
          onNavigateToProfile={(username) => onNavigate(`profile/${username}`)}
          renderMedia={(post) => (
            post.url ? (
              post.type === "video" ? (
                <VideoPlayer
                  src={post.url}
                  videoId={post.id}
                  containerClassName="w-full h-full"
                  className="w-full h-full"
                  aspectRatio="9/16"
                />
              ) : (
                <img
                  src={post.url}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="text-center text-white p-6">
                {post.caption || "Post"}
              </div>
            )
          )}
        />
      </div>
    </Layout>
  );
}
