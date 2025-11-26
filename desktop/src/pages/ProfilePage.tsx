import Layout from "@/components/Layout";
import { PostDetailDialog } from "@/components/PostDetailDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserData } from "@/store/userStore";
import { getAccessToken, getServerUrl } from "@/utils/auth";
import {
  Bookmark,
  Calendar,
  Edit,
  Grid3x3,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Reply,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TabType = "posts" | "reels" | "liked" | "saved";

type ProfileData = {
  id: string;
  firstName?: string;
  surName?: string;
  username: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  createdAt?: string;
};

type PostUser = {
  id?: string;
  firstName?: string;
  surName?: string;
  username?: string;
  profileImage?: string;
};

type Post = {
  id: string;
  caption?: string;
  url?: string;
  type: "text" | "image" | "video";
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  user?: PostUser;
};

type Comment = {
  id: string;
  userId: string;
  user?: PostUser;
  comment: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  replies?: Comment[];
  replyCount?: number;
};

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
}

const formatJoinedDate = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
};

const formatNumber = (value?: number) => {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

const formatTimeAgo = (date?: string) => {
  if (!date) return "";
  const now = new Date();
  const value = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - value.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

export default function ProfilePage({
  onNavigate,
  onSignOut,
  userData,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesHasMore, setRepliesHasMore] = useState<Record<string, boolean>>(
    {}
  );

  const username = userData?.username;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const serverUrl = getServerUrl();
        const accessToken = getAccessToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${serverUrl}/users/${username}`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setProfile(result.data);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile?.username) return;

    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const serverUrl = getServerUrl();
        const accessToken = getAccessToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(
          `${serverUrl}/users/${profile.username}/posts?type=${activeTab}`,
          {
            method: "GET",
            headers,
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          setPosts(result.data?.posts || []);

          if (result.data?.posts) {
            const liked = result.data.posts
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            const saved = result.data.posts
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(liked));
            setSavedPosts(new Set(saved));
          } else {
            setLikedPosts(new Set());
            setSavedPosts(new Set());
          }
        } else {
          setPosts([]);
          setLikedPosts(new Set());
          setSavedPosts(new Set());
        }
      } catch (error) {
        console.error("Error fetching profile posts:", error);
        setPosts([]);
        setLikedPosts(new Set());
        setSavedPosts(new Set());
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [profile?.username, activeTab]);

  const displayName = useMemo(() => {
    if (!profile) return "";
    if (profile.firstName || profile.surName) {
      return `${profile.firstName ?? ""} ${profile.surName ?? ""}`.trim();
    }
    return profile.username;
  }, [profile]);

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

  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedPost?.id || !isPostDialogOpen) {
        setComments([]);
        setLoadedReplies(new Set());
        setRepliesHasMore({});
        setReplyingTo(null);
        setReplyText({});
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        setComments([]);
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

  const coverImage =
    profile?.coverImage || "https://picsum.photos/1200/400?blur=2";
  const avatarImage =
    profile?.profileImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      profile?.username || "loop"
    }`;

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

    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: Math.max(0, post.likesCount - 1),
                isLiked: false,
              }
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
            ? {
                ...post,
                likesCount: post.likesCount + 1,
                isLiked: true,
              }
            : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? { ...prev, likesCount: prev.likesCount + 1, isLiked: true }
            : null
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
                ? { ...post, likesCount: previousLikesCount, isLiked: true }
                : post
            )
          );
          if (selectedPost?.id === postId) {
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    likesCount: previousLikesCount,
                    isLiked: true,
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
                ? { ...post, likesCount: previousLikesCount, isLiked: false }
                : post
            )
          );
          if (selectedPost?.id === postId) {
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    likesCount: previousLikesCount,
                    isLiked: false,
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
              ? { ...post, likesCount: previousLikesCount, isLiked: true }
              : post
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: previousLikesCount,
                  isLiked: true,
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
              ? { ...post, likesCount: previousLikesCount, isLiked: false }
              : post
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: previousLikesCount,
                  isLiked: false,
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
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: false } : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, isSaved: false } : null));
      }
    } else {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: true } : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, isSaved: true } : null));
      }
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
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId ? { ...post, isSaved: true } : post
            )
          );
          if (selectedPost?.id === postId) {
            setSelectedPost((prev) =>
              prev ? { ...prev, isSaved: true } : null
            );
          }
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
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId ? { ...post, isSaved: false } : post
            )
          );
          if (selectedPost?.id === postId) {
            setSelectedPost((prev) =>
              prev ? { ...prev, isSaved: false } : null
            );
          }
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
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isSaved: true } : post
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, isSaved: true } : null));
        }
      } else {
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isSaved: false } : post
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) =>
            prev ? { ...prev, isSaved: false } : null
          );
        }
      }
      console.error("Error saving post:", error);
      toast.error("Error", {
        description: "Failed to save post",
      });
    }
  };

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
        if (result.data?.comment) {
          if (parentId) {
            setComments((prev) =>
              prev.map((comment) => {
                if (comment.id === parentId) {
                  if (loadedReplies.has(parentId)) {
                    return {
                      ...comment,
                      replies: [
                        ...(comment.replies || []),
                        result.data.comment,
                      ],
                    };
                  }
                  return {
                    ...comment,
                    replyCount: (comment.replyCount || 0) + 1,
                  };
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
            setComments((prev) => [result.data.comment, ...prev]);
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
                  replyCount: result.data.hasMore
                    ? result.data.total
                    : undefined,
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

  const renderPosts = () => {
    if (isLoadingPosts) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading {activeTab}...
          </p>
        </div>
      );
    }

    if (posts.length === 0) {
      const emptyCopy: Record<TabType, string> = {
        posts: "No posts yet",
        reels: "No reels yet",
        liked: "No liked posts yet",
        saved: "No saved posts yet",
      };
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyCopy[activeTab]}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 md:gap-3 p-2 sm:p-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-muted overflow-hidden rounded-lg group cursor-pointer"
            onClick={() => {
              const fallbackUser: PostUser | undefined = profile
                ? {
                    id: profile.id,
                    firstName: profile.firstName,
                    surName: profile.surName,
                    username: profile.username,
                    profileImage: profile.profileImage,
                  }
                : undefined;
              setSelectedPost(
                post.user ? post : { ...post, user: fallbackUser }
              );
              setIsPostDialogOpen(true);
            }}
          >
            {post.url ? (
              post.type === "video" ? (
                <video
                  src={post.url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                />
              ) : (
                <img
                  src={post.url}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full px-4 text-center text-xs text-muted-foreground">
                {post.caption || "Post"}
              </div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white text-sm font-semibold">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 fill-current" />
                  {post.likesCount}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 fill-current" />
                  {post.commentsCount}
                </div>
              </div>
            </div>

            {post.type === "video" && (
              <div className="absolute top-2 right-2">
                <Play className="h-4 w-4 text-white drop-shadow" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProfileHeader = () => {
    if (isLoadingProfile) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-muted-foreground">
            We couldn’t load your profile. Please try again later.
          </p>
          <Button variant="outline" onClick={() => onNavigate("home")}>
            Back to Home
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="relative h-40 sm:h-52 md:h-60 bg-muted">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-4 sm:px-8 -mt-12 sm:-mt-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
                <AvatarImage src={avatarImage} alt={displayName} />
                <AvatarFallback>
                  {displayName ? displayName[0]?.toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Joined {formatJoinedDate(profile.createdAt)}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div>
              <span className="font-semibold text-foreground mr-1">
                {formatNumber(profile.following)}
              </span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div>
              <span className="font-semibold text-foreground mr-1">
                {formatNumber(profile.followers)}
              </span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div>
              <span className="font-semibold text-foreground mr-1">
                {formatNumber(profile.postsCount)}
              </span>
              <span className="text-muted-foreground">Posts</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <Layout
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      userData={userData}
      currentPage="profile"
    >
      <div className="flex-1 overflow-y-auto">
        {renderProfileHeader()}

        <div className="px-4 sm:px-8 mt-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="reels" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Reels</span>
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Liked</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4">{renderPosts()}</div>

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
        />
      </div>
    </Layout>
  );
}
