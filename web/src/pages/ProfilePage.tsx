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
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import {
  Bookmark,
  Calendar,
  Edit,
  Grid3x3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Reply,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

type TabType = "posts" | "reels" | "liked" | "saved";

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

type UserData = {
  id: string;
  firstName: string;
  surName: string;
  username: string;
  email: string;
  bio: string;
  gender: string;
  dateOfBirth: string;
  profileImage: string;
  coverImage: string;
  isVerified: boolean;
  createdAt: string;
  postsCount: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
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

// Helper function to format date
const formatDate = (date: string): string => {
  const d = new Date(date);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.userData);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    surName: "",
    username: "",
    bio: "",
    profileImage: "",
    coverImage: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
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
            // Add reply to the parent comment's replies array
            setComments((prev) =>
              prev.map((comment) => {
                if (comment.id === parentId) {
                  // If replies are already loaded, add the new reply
                  if (loadedReplies.has(parentId)) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), result.data],
                    };
                  } else {
                    // If replies are not loaded, increment reply count
                    return {
                      ...comment,
                      replyCount: (comment.replyCount || 0) + 1,
                    };
                  }
                }
                return comment;
              })
            );
            // Clear reply text for this comment
            setReplyText((prev) => {
              const newReplyText = { ...prev };
              delete newReplyText[parentId];
              return newReplyText;
            });
            setReplyingTo(null);
          } else {
            // Add new top-level comment
            setComments((prev) => [result.data, ...prev]);
            setNewComment("");
          }
          // Update comments count
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

    // Optimistic update - update UI immediately
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
        // Unsave
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
        // Save
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
          // Update the comment with its replies
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
                  replyCount: undefined, // Clear replyCount since we have the actual replies
                };
              }
              return comment;
            })
          );

          // Track if there are more replies and total count
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
    await handleLoadReplies(commentId, skip, 10); // Load 10 more at a time
  };

  // Remove @ symbol if present in username
  const cleanUsername = username?.startsWith("@")
    ? username.slice(1)
    : username || "";

  // Check if this is the current user's profile
  const isOwnProfile =
    currentUser?.username.toLowerCase() === cleanUsername.toLowerCase();

  // Fetch user data
  const fetchUserData = async () => {
    if (!cleanUsername) return;

    try {
      setIsLoading(true);
      const serverUrl = import.meta.env.VITE_SERVER_URL || "";
      const response = await fetch(`${serverUrl}/users/${cleanUsername}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setUserData(result.data);
          // Initialize follow state
          setIsFollowing(result.data.isFollowing || false);
        }
      } else {
        const error = await response.json();
        toast.error("Error", {
          description: error.message || "Failed to load user profile",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error", {
        description: "Failed to load user profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [cleanUsername]);

  // Fetch posts based on active tab
  useEffect(() => {
    const fetchPosts = async () => {
      if (!cleanUsername) return;

      try {
        setIsLoadingPosts(true);
        const serverUrl = import.meta.env.VITE_SERVER_URL || "";
        const type =
          activeTab === "reels"
            ? "reels"
            : activeTab === "liked"
            ? "liked"
            : activeTab === "saved"
            ? "saved"
            : "posts";

        const response = await fetch(
          `${serverUrl}/users/${cleanUsername}/posts?type=${type}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data?.posts) {
            setPosts(result.data.posts);
            // Initialize likedPosts state from fetched posts
            const likedPostIds = result.data.posts
              .filter((post: Post) => post.isLiked)
              .map((post: Post) => post.id);
            setLikedPosts(new Set(likedPostIds));
            // Initialize savedPosts state from fetched posts
            const savedPostIds = result.data.posts
              .filter((post: Post) => post.isSaved)
              .map((post: Post) => post.id);
            setSavedPosts(new Set(savedPostIds));
          }
        } else {
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to load posts",
          });
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Error", {
          description: "Failed to load posts",
        });
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [cleanUsername, activeTab]);

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

    // Get current likes count for revert
    const currentPost = posts.find((p) => p.id === postId);
    const previousLikesCount = currentPost?.likesCount || 0;
    const selectedPostLikesCount =
      selectedPost?.id === postId ? selectedPost.likesCount : null;

    // Optimistic update - update UI immediately
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
        // Unlike
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
        // Like
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
      // Revert on error
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

  const handleFollow = async () => {
    if (!cleanUsername || !userData) {
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
        description: "You must be logged in to follow users",
      });
      return;
    }

    const serverUrl = getServerUrl();
    const isCurrentlyFollowing = isFollowing;
    const previousFollowers = userData.followers;

    // Optimistic update - update UI immediately
    setIsFollowing(!isCurrentlyFollowing);
    setUserData((prev) =>
      prev
        ? {
            ...prev,
            followers: isCurrentlyFollowing
              ? Math.max(0, prev.followers - 1)
              : prev.followers + 1,
          }
        : null
    );

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const response = await fetch(
          `${serverUrl}/users/${cleanUsername}/follow`,
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
          setIsFollowing(isCurrentlyFollowing);
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  followers: previousFollowers,
                }
              : null
          );
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to unfollow user",
          });
        }
      } else {
        // Follow
        const response = await fetch(
          `${serverUrl}/users/${cleanUsername}/follow`,
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
          setIsFollowing(isCurrentlyFollowing);
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  followers: previousFollowers,
                }
              : null
          );
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to follow user",
          });
        }
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(isCurrentlyFollowing);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              followers: previousFollowers,
            }
          : null
      );
      console.error("Error following/unfollowing user:", error);
      toast.error("Error", {
        description: "Failed to follow/unfollow user",
      });
    }
  };

  const handleEditProfileClick = () => {
    if (userData) {
      setEditFormData({
        firstName: userData.firstName,
        surName: userData.surName,
        username: userData.username,
        bio: userData.bio || "",
        profileImage: userData.profileImage || "",
        coverImage: userData.coverImage || "",
      });
      setProfileImagePreview(userData.profileImage || null);
      setCoverImagePreview(userData.coverImage || null);
      setProfileImageFile(null);
      setCoverImageFile(null);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setProfileImageFile(null);
    setCoverImageFile(null);
    setProfileImagePreview(null);
    setCoverImagePreview(null);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setEditFormData((prev) => ({ ...prev, profileImage: "" }));
  };

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setEditFormData((prev) => ({ ...prev, coverImage: "" }));
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
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
      throw new Error("Not authenticated");
    }

    // Get Cloudinary signature
    const serverUrl = getServerUrl();
    const signatureResponse = await fetch(
      `${serverUrl}/cloudinary/signature?folder=loop-social-platform`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

    if (!signatureResponse.ok) {
      throw new Error("Failed to get Cloudinary signature");
    }

    const signatureData = await signatureResponse.json();
    const { data } = signatureData;

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", data.apiKey);
    formData.append("timestamp", data.timestamp.toString());
    formData.append("folder", data.folder);
    formData.append("signature", data.signature);

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return uploadResponse.data.secure_url;
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUploading(true);

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
          description: "You must be logged in to update your profile",
        });
        return;
      }

      // Upload images if files are selected
      let profileImageUrl = editFormData.profileImage;
      let coverImageUrl = editFormData.coverImage;

      if (profileImageFile) {
        profileImageUrl = await uploadImageToCloudinary(profileImageFile);
      }

      if (coverImageFile) {
        coverImageUrl = await uploadImageToCloudinary(coverImageFile);
      }

      // Update profile
      const serverUrl = getServerUrl();
      const updateData: {
        firstName: string;
        surName: string;
        username: string;
        bio: string;
        profileImage?: string;
        coverImage?: string;
      } = {
        firstName: editFormData.firstName,
        surName: editFormData.surName,
        username: editFormData.username,
        bio: editFormData.bio,
      };

      if (profileImageUrl) {
        updateData.profileImage = profileImageUrl;
      }

      if (coverImageUrl) {
        updateData.coverImage = coverImageUrl;
      }

      const response = await fetch(`${serverUrl}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          // Update user store
          const { setUserData: setStoreUserData } = useUserStore.getState();
          setStoreUserData(result.data);

          // Refresh profile data
          await fetchUserData();

          toast.success("Success", {
            description: "Profile updated successfully",
          });

          setIsEditDialogOpen(false);
        }
      } else {
        const error = await response.json();
        toast.error("Error", {
          description: error.message || "Failed to update profile",
        });
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if user not found
  if (!userData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  // Get display name
  const displayName = `${userData.firstName} ${userData.surName}`;
  const getDummyAvatar = (username: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  };
  const avatarUrl = userData.profileImage || getDummyAvatar(userData.username);
  const coverImageUrl =
    userData.coverImage || "https://picsum.photos/800/300?random=profile";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-linear-to-r from-blue-500 to-purple-500">
        <img
          src={coverImageUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Info */}
      <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 mb-3 sm:mb-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 border-2 sm:border-4 border-background shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
                {displayName[0]?.toUpperCase() ||
                  userData.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="sm:hidden">
              <h1 className="text-base sm:text-lg font-bold truncate">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                @{userData.username}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 mt-0 sm:mt-16 md:mt-20 lg:mt-24 flex-wrap">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfileClick}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden min-[375px]:inline">Edit Profile</span>
                <span className="min-[375px]:hidden">Edit</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:flex-none h-8 sm:h-9 w-8 sm:w-9"
                >
                  <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mb-3 sm:mb-4 hidden sm:block">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
            {displayName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            @{userData.username}
          </p>
        </div>

        {userData.bio && (
          <p className="text-xs sm:text-sm mb-2 sm:mb-3 whitespace-pre-wrap wrap-break-word">
            {userData.bio}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Joined {formatDate(userData.createdAt)}</span>
        </div>

        <div className="flex gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
          <button
            className="hover:underline shrink-0"
            onClick={() => navigate(`/@${userData.username}/following`)}
          >
            <span className="font-semibold text-foreground">
              {userData.following.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button
            className="hover:underline shrink-0"
            onClick={() => navigate(`/@${userData.username}/followers`)}
          >
            <span className="font-semibold text-foreground">
              {userData.followers.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </button>
          <button
            className="hover:underline shrink-0"
            onClick={() => setActiveTab("posts")}
          >
            <span className="font-semibold text-foreground">
              {userData.postsCount.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Posts</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "posts"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "reels"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => setActiveTab("liked")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "liked"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "saved"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Posts Grid */}
      <div>
        {isLoadingPosts ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-sm">
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {activeTab === "posts" && "No posts yet"}
              {activeTab === "reels" && "No reels yet"}
              {activeTab === "liked" && "No liked posts yet"}
              {activeTab === "saved" && "No saved posts yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-1 md:gap-2 p-0.5 sm:p-1 md:p-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setSelectedPost(post);
                  setIsPostDialogOpen(true);
                  // Ensure liked state is synced
                  if (post.isLiked) {
                    setLikedPosts((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(post.id);
                      return newSet;
                    });
                  }
                  // Ensure saved state is synced
                  if (post.isSaved) {
                    setSavedPosts((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(post.id);
                      return newSet;
                    });
                  }
                }}
              >
                {/* Post Image/Video */}
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

                {/* Multi-image/video indicator */}
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

      {/* Post Detail Dialog */}
      <Dialog
        open={isPostDialogOpen}
        onOpenChange={(open) => {
          setIsPostDialogOpen(open);
          if (!open) {
            setSelectedPost(null);
            setMediaAspectRatio(null);
          }
        }}
      >
        <DialogContent
          className="p-0 gap-0 overflow-hidden z-[80]"
          overlayClassName="z-[75]"
          showCloseButton={false}
          style={(() => {
            const baseWidth = isLargeScreen ? 70 : 95;
            const baseHeight = isLargeScreen ? 70 : 95;

            if (mediaAspectRatio && selectedPost?.url) {
              // Calculate dimensions based on aspect ratio
              const maxWidth = (window.innerWidth * baseWidth) / 100;
              const maxHeight = (window.innerHeight * baseHeight) / 100;

              let width = maxWidth;
              let height = maxHeight;

              // For landscape (width > height)
              if (mediaAspectRatio > 1) {
                height = Math.min(maxHeight, maxWidth / mediaAspectRatio);
                width = height * mediaAspectRatio;
                // Add space for content section (60% of width for 3/5 ratio)
                width = width + width * 0.6;
              }
              // For portrait (height > width)
              else if (mediaAspectRatio < 1) {
                width = Math.min(maxWidth, maxHeight * mediaAspectRatio);
                height = width / mediaAspectRatio;
                // Add space for content section (60% of width for 3/5 ratio)
                width = width + width * 0.6;
              }
              // For square
              else {
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

            // Default dimensions
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
              <div className="relative w-full md:w-2/5 bg-black flex items-center justify-center overflow-hidden h-full max-h-full">
                {selectedPost.url ? (
                  selectedPost.type === "video" ? (
                    <video
                      src={selectedPost.url}
                      controls
                      className="object-contain"
                      playsInline
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        width: "auto",
                        height: "auto",
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
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
                                  {/* Show Replies Button */}
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

                            {/* Replies - Only show if loaded */}
                            {loadedReplies.has(comment.id) &&
                              comment.replies &&
                              comment.replies.length > 0 && (
                                <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                                  {/* Show only first 2 replies initially, or all if hasMore is false */}
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
                                            <button
                                              onClick={() => {
                                                setReplyingTo(
                                                  replyingTo === reply.id
                                                    ? null
                                                    : reply.id
                                                );
                                                if (replyingTo !== reply.id) {
                                                  setReplyText((prev) => ({
                                                    ...prev,
                                                    [reply.id]: "",
                                                  }));
                                                }
                                              }}
                                              className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                                            >
                                              <Reply className="h-3 w-3" />
                                              Reply
                                            </button>
                                          </div>
                                        </div>

                                        {/* Reply Input for nested reply */}
                                        {replyingTo === reply.id && (
                                          <div className="ml-11 pr-2">
                                            <div className="flex gap-2">
                                              <Input
                                                type="text"
                                                placeholder={`Reply to @${
                                                  reply.user.username || "user"
                                                }...`}
                                                value={
                                                  replyText[reply.id] || ""
                                                }
                                                onChange={(e) =>
                                                  setReplyText((prev) => ({
                                                    ...prev,
                                                    [reply.id]: e.target.value,
                                                  }))
                                                }
                                                onKeyDown={(e) => {
                                                  if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                  ) {
                                                    e.preventDefault();
                                                    handleSubmitComment(
                                                      reply.id
                                                    );
                                                  }
                                                }}
                                                className="flex-1 text-sm"
                                                disabled={isSubmittingComment}
                                                autoFocus
                                              />
                                              <Button
                                                onClick={() =>
                                                  handleSubmitComment(reply.id)
                                                }
                                                disabled={
                                                  !replyText[
                                                    reply.id
                                                  ]?.trim() ||
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
                                                    const newReplyText = {
                                                      ...prev,
                                                    };
                                                    delete newReplyText[
                                                      reply.id
                                                    ];
                                                    return newReplyText;
                                                  });
                                                }}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Nested Replies */}
                                        {reply.replies &&
                                          reply.replies.length > 0 && (
                                            <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                                              {reply.replies.map(
                                                (nestedReply) => {
                                                  if (!nestedReply.user) {
                                                    return null;
                                                  }
                                                  return (
                                                    <div
                                                      key={nestedReply.id}
                                                      className="flex gap-3 hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors"
                                                    >
                                                      <Avatar className="h-6 w-6 shrink-0">
                                                        <AvatarImage
                                                          src={
                                                            nestedReply.user
                                                              .profileImage ||
                                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                                              nestedReply.user
                                                                .username ||
                                                              "user"
                                                            }`
                                                          }
                                                          alt={
                                                            nestedReply.user
                                                              .username ||
                                                            "User"
                                                          }
                                                        />
                                                        <AvatarFallback>
                                                          {nestedReply.user.firstName?.[0]?.toUpperCase() ||
                                                            nestedReply.user.username?.[0]?.toUpperCase() ||
                                                            "U"}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <button
                                                            onClick={() => {
                                                              setIsPostDialogOpen(
                                                                false
                                                              );
                                                              navigate(
                                                                `/@${
                                                                  nestedReply
                                                                    .user
                                                                    ?.username ||
                                                                  ""
                                                                }`
                                                              );
                                                            }}
                                                            className="font-semibold text-xs hover:underline"
                                                          >
                                                            @
                                                            {nestedReply.user
                                                              .username ||
                                                              "unknown"}
                                                          </button>
                                                          <span className="text-xs text-muted-foreground">
                                                            {formatTimeAgo(
                                                              nestedReply.createdAt
                                                            )}
                                                          </span>
                                                        </div>
                                                        <p className="text-xs whitespace-pre-wrap wrap-break-word">
                                                          {nestedReply.comment}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and images.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border">
                {coverImagePreview ? (
                  <div className="relative h-full w-full">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveCoverImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-full w-full cursor-pointer items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Upload cover image
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
                  {profileImagePreview ? (
                    <div className="relative h-full w-full">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveProfileImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer items-center justify-center bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const syntheticEvent = {
                            target: { files: [file] },
                          } as unknown as React.ChangeEvent<HTMLInputElement>;
                          handleProfileImageChange(syntheticEvent);
                        }
                      };
                      input.click();
                    }}
                  >
                    Change Profile Picture
                  </Button>
                </div>
              </div>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="First name"
              />
            </div>

            {/* Surname */}
            <div className="space-y-2">
              <Label htmlFor="surName">Surname</Label>
              <Input
                id="surName"
                value={editFormData.surName}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    surName: e.target.value,
                  }))
                }
                placeholder="Surname"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editFormData.username}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder="Username"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editFormData.bio}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                placeholder="Tell us about yourself"
                maxLength={160}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {editFormData.bio.length}/160
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleEditDialogClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUploading}>
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
