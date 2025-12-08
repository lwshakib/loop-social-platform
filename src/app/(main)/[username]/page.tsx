"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { PostDialog } from "../_components/post-dialog";
import VideoPlayer from "../_components/video-player";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSocialStore } from "@/context";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
  getPostComments,
  createComment,
} from "@/lib/post-actions";
import {
  Bookmark,
  Calendar,
  Edit,
  Grid3x3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TabType = "posts" | "reels" | "liked" | "saved";

type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string;
  type: "text" | "image" | "reel";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type UserData = {
  id: string;
  username: string;
  name: string;
  email: string;
  bio: string;
  imageUrl: string;
  coverImageUrl: string;
  dateOfBirth: string;
  gender: string;
  isVerified: boolean;
  createdAt: string;
  postsCount: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
};

const ProfileSkeleton = () => (
  <div className="flex-1">
    <div className="space-y-4">
      <Skeleton className="h-36 sm:h-48 w-full rounded-xl" />
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32 sm:w-40" />
            <Skeleton className="h-4 w-52 sm:w-64" />
            <div className="flex gap-3">
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  className="h-4 w-16 sm:w-20 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-9 w-28 sm:w-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PostsGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-1 md:gap-2 p-0.5 sm:p-1 md:p-2">
    {Array.from({ length: 8 }).map((_, idx) => (
      <Skeleton key={idx} className="aspect-square w-full rounded-md" />
    ))}
  </div>
);

const CommentsSkeleton = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 sm:w-32" />
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

// Valid tabs constant
const validTabs: TabType[] = ["posts", "reels", "liked", "saved"];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useSocialStore((state) => state.user);
  const username = params?.username as string;

  // Get initial tab from URL or default to "posts"
  const tabFromUrl = searchParams.get("tab") as TabType | null;
  const initialTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "posts";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    username: "",
    bio: "",
    imageUrl: "",
    coverImageUrl: "",
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const profilePreview = useMemo(
    () => (profileFile ? URL.createObjectURL(profileFile) : null),
    [profileFile]
  );
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  );
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [followersList, setFollowersList] = useState<UserData[]>([]);
  const [followingList, setFollowingList] = useState<UserData[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Use username as-is (don't clean it)
  const cleanUsername = username || "";

  // Check if this is the current user's profile (prefer id match)
  const isOwnProfile =
    !!currentUser &&
    (currentUser.id === userData?.id ||
      currentUser.username.toLowerCase() === cleanUsername.toLowerCase());

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "posts") {
      // Remove tab param for posts (default)
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Sync tab with URL on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabType | null;
    if (
      tabFromUrl &&
      validTabs.includes(tabFromUrl) &&
      tabFromUrl !== activeTab
    ) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab !== "posts") {
      setActiveTab("posts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!cleanUsername) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${cleanUsername}`);

        if (!response.ok) {
          if (response.status === 404) {
            setUserData(null);
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const result = await response.json();
        if (result.data) {
          setUserData(result.data);
          setIsFollowing(result.data.isFollowing || false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [cleanUsername]);

  // Fetch posts based on active tab
  useEffect(() => {
    const fetchPosts = async () => {
      if (!cleanUsername) return;

      try {
        setIsLoadingPosts(true);
        const response = await fetch(
          `/api/users/${cleanUsername}/posts?type=${activeTab}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const result = await response.json();
        if (result.data) {
          const normalizedPosts = result.data.map((post: Post) => ({
            ...post,
            likesCount: Number(post.likesCount ?? 0),
            commentsCount: Number(post.commentsCount ?? 0),
          }));

          setPosts(normalizedPosts);
          // Initialize liked and saved posts sets
          const likedPostIds = normalizedPosts
            .filter((post: Post) => post.isLiked)
            .map((post: Post) => post.id);
          setLikedPosts(new Set(likedPostIds));
          const savedPostIds = normalizedPosts
            .filter((post: Post) => post.isSaved)
            .map((post: Post) => post.id);
          setSavedPosts(new Set(savedPostIds));
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [cleanUsername, activeTab]);

  const handleEditProfileClick = () => {
    if (userData) {
      setEditFormData({
        name: userData.name,
        username: userData.username,
        bio: userData.bio || "",
        imageUrl: userData.imageUrl || "",
        coverImageUrl: userData.coverImageUrl || "",
      });
      setProfileFile(null);
      setCoverFile(null);
      setIsEditDialogOpen(true);
    }
  };

  const uploadImage = async (file: File, folder = "loop-social-platform") => {
    const signatureRes = await fetch(
      `/api/cloudinary/signature?folder=${encodeURIComponent(folder)}`
    );
    if (!signatureRes.ok) throw new Error("Failed to get upload signature");
    const signatureJson = await signatureRes.json();
    const sigData = signatureJson.data;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sigData.apiKey);
    formData.append("timestamp", String(sigData.timestamp));
    formData.append("folder", sigData.folder);
    formData.append("signature", sigData.signature);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Failed to upload image");
    const uploadJson = await uploadRes.json();
    return uploadJson.secure_url || uploadJson.url;
  };

  const handleUpdateProfile = async () => {
    if (!currentUser || !userData) return;

    let nextImageUrl = editFormData.imageUrl;
    let nextCoverUrl = editFormData.coverImageUrl;

    try {
      setIsUpdatingProfile(true);
      if (profileFile) {
        nextImageUrl = await uploadImage(
          profileFile,
          "loop-social-platform/profile"
        );
      }
      if (coverFile) {
        nextCoverUrl = await uploadImage(
          coverFile,
          "loop-social-platform/cover"
        );
      }

      const response = await fetch(`/api/users/${cleanUsername}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          imageUrl: nextImageUrl,
          coverImageUrl: nextCoverUrl,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update profile");
        return;
      }

      const result = await response.json();
      if (result.data) {
        setUserData(result.data);
        setProfileFile(null);
        setCoverFile(null);
        setIsEditDialogOpen(false);
        // If username changed, redirect to the new profile route
        if (
          result.data.username &&
          result.data.username.toLowerCase() !== cleanUsername.toLowerCase()
        ) {
          router.replace(`/${result.data.username}`);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userData) return;

    const nextFollowing = !isFollowing;
    const prevIsFollowing = isFollowing;
    const prevUserData = userData;

    // Optimistic update: adjust following if viewing own profile, otherwise followers of viewed user
    setIsFollowing(nextFollowing);
    setUserData((prev) => {
      if (!prev) return prev;
      if (isOwnProfile) {
        return {
          ...prev,
          following: nextFollowing
            ? prev.following + 1
            : Math.max(0, prev.following - 1),
        };
      }
      return {
        ...prev,
        followers: nextFollowing
          ? prev.followers + 1
          : Math.max(0, prev.followers - 1),
      };
    });

    try {
      const method = nextFollowing ? "POST" : "DELETE";
      const res = await fetch(`/api/users/${userData.username}/follow`, {
        method,
      });

      if (!res.ok) {
        throw new Error("Failed to update follow status");
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      // Revert optimistic update on error
      setIsFollowing(prevIsFollowing);
      setUserData(prevUserData);
    }
  };

  const fetchFollowers = async () => {
    if (!cleanUsername) return;
    try {
      setIsLoadingFollowers(true);
      const res = await fetch(`/api/users/${cleanUsername}/followers`);
      if (res.ok) {
        const json = await res.json();
        setFollowersList(json.data || []);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      setFollowersList([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (!cleanUsername) return;
    try {
      setIsLoadingFollowing(true);
      const res = await fetch(`/api/users/${cleanUsername}/following`);
      if (res.ok) {
        const json = await res.json();
        setFollowingList(json.data || []);
      }
    } catch (error) {
      console.error("Error fetching following:", error);
      setFollowingList([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const handleUnfollowFromList = async (targetUsername: string) => {
    if (!currentUser || !userData || !isOwnProfile) return;

    const prevList = followingList;
    const prevUserData = userData;

    // Optimistic update
    setFollowingList((prev) =>
      prev.filter((user) => user.username !== targetUsername)
    );
    setUserData((prev) =>
      prev
        ? {
            ...prev,
            following: Math.max(0, prev.following - 1),
          }
        : prev
    );

    try {
      const res = await fetch(`/api/users/${targetUsername}/follow`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to unfollow");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      // Revert on failure
      setFollowingList(prevList);
      setUserData(prevUserData);
    }
  };

  // Handle like/unlike with optimistic updates
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    // Store previous state for rollback
    const previousSelectedPost = selectedPost;
    const previousPosts = posts;

    // Optimistically update UI immediately
    if (isLiked) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: false,
              likesCount: Math.max(0, prev.likesCount - 1),
            }
          : null
      );
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: false,
                likesCount: Math.max(0, post.likesCount - 1),
              }
            : post
        )
      );
    } else {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: true,
              likesCount: prev.likesCount + 1,
            }
          : null
      );
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: true,
                likesCount: post.likesCount + 1,
              }
            : post
        )
      );
    }

    // Make API call in background
    try {
      if (isLiked) {
        await toggleUnlike(postId);
      } else {
        await toggleLike(postId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setSelectedPost(previousSelectedPost);
      setPosts(previousPosts);
    }
  };

  // Handle bookmark/unbookmark with optimistic updates
  const handleBookmark = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    // Store previous state for rollback
    const previousSelectedPost = selectedPost;
    const previousPosts = posts;

    // Optimistically update UI immediately
    if (isSaved) {
      setSelectedPost((prev) => (prev ? { ...prev, isSaved: false } : null));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: false } : post
        )
      );
    } else {
      setSelectedPost((prev) => (prev ? { ...prev, isSaved: true } : null));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: true } : post
        )
      );
    }

    // Make API call in background
    try {
      if (isSaved) {
        await toggleUnbookmark(postId);
      } else {
        await toggleBookmark(postId);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Revert on error
      setSelectedPost(previousSelectedPost);
      setPosts(previousPosts);
    }
  };

  // Fetch comments when post dialog opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!isPostDialogOpen || !selectedPost) return;

      try {
        setIsLoadingComments(true);
        const result = await getPostComments(selectedPost.id);
        if (result.data) {
          setComments(result.data);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [isPostDialogOpen, selectedPost?.id]);

  // Reset comment state when dialog closes
  useEffect(() => {
    if (!isPostDialogOpen) {
      setCommentContent("");
      setReplyingTo(null);
      setReplyContent("");
      setComments([]);
    }
  }, [isPostDialogOpen]);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!selectedPost || !commentContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const result = await createComment(
        selectedPost.id,
        commentContent.trim()
      );
      if (result.data) {
        setComments((prev) => [result.data, ...prev]);
        setCommentContent("");
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                commentsCount: prev.commentsCount + 1,
              }
            : null
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPost.id
              ? {
                  ...post,
                  commentsCount: post.commentsCount + 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentId: string) => {
    if (!selectedPost || !replyContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const result = await createComment(
        selectedPost.id,
        replyContent.trim(),
        parentId
      );
      if (result.data) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), result.data],
                }
              : comment
          )
        );
        setReplyingTo(null);
        setReplyContent("");
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                commentsCount: prev.commentsCount + 1,
              }
            : null
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPost.id
              ? {
                  ...post,
                  commentsCount: post.commentsCount + 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <ProfileSkeleton />;
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

  const avatarUrl =
    userData.imageUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;
  const coverImageUrl = "https://picsum.photos/800/300?random=profile";
  const currentCoverImage =
    userData.coverImageUrl && userData.coverImageUrl.length > 0
      ? userData.coverImageUrl
      : coverImageUrl;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-linear-to-r from-blue-500 to-purple-500">
        <img
          src={currentCoverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Info */}
      <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 mb-3 sm:mb-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 border-2 sm:border-4 border-background shrink-0">
              <AvatarImage src={avatarUrl} alt={userData.name} />
              <AvatarFallback className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
                {userData.name[0]?.toUpperCase() ||
                  userData.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="sm:hidden">
              <h1 className="text-base sm:text-lg font-bold truncate">
                {userData.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {userData.username}
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
                {currentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Message</span>
                  </Button>
                )}
                {currentUser && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={handleFollow}
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
                {currentUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:flex-none h-8 sm:h-9 w-8 sm:w-9"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-3 sm:mb-4 hidden sm:block">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
            {userData.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            {userData.username}
          </p>
        </div>

        {userData.bio && (
          <p className="text-xs sm:text-sm mb-2 sm:mb-3 whitespace-pre-wrap">
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
            onClick={() => {
              setIsFollowingOpen(true);
              fetchFollowing();
            }}
          >
            <span className="font-semibold text-foreground">
              {userData.following.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button
            className="hover:underline shrink-0"
            onClick={() => {
              setIsFollowersOpen(true);
              fetchFollowers();
            }}
          >
            <span className="font-semibold text-foreground">
              {userData.followers.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </button>
          <button
            className="hover:underline shrink-0"
            onClick={() => handleTabChange("posts")}
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
          onClick={() => handleTabChange("posts")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "posts"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => handleTabChange("reels")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "reels"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => handleTabChange("liked")}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm transition-colors ${
            activeTab === "liked"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => handleTabChange("saved")}
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
          <PostsGridSkeleton />
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
                }}
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
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                        {post.content || "Post"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay on hover */}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <PostDialog
        open={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        className="p-0"
      >
        {selectedPost && (
          <div className="flex flex-col md:flex-row h-full max-h-[95vh]">
            {/* Media Section */}
            <div className="relative w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden min-h-[400px] md:min-h-0 md:h-full">
              {selectedPost.imageUrl ? (
                selectedPost.type === "reel" ? (
                  <VideoPlayer
                    src={selectedPost.imageUrl}
                    videoId={selectedPost.id}
                    className="w-full h-full max-h-[95vh]"
                    containerClassName="w-full h-full max-h-[95vh]"
                    autoPlay={true}
                    loop={true}
                    initialMuted={true}
                    showControls={true}
                    aspectRatio="9/16"
                  />
                ) : (
                  <img
                    src={selectedPost.imageUrl}
                    alt="Post"
                    className="w-full h-full object-contain max-h-[95vh]"
                  />
                )
              ) : (
                <div className="text-center p-8 text-white">
                  <p className="text-sm">{selectedPost.content || "Post"}</p>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="w-full md:w-2/5 flex flex-col h-full max-h-[95vh]">
              <div className="shrink-0">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>
                        {userData.name[0]?.toUpperCase() ||
                          userData.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {userData.username}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedPost.content && (
                  <div className="p-4 border-b">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(selectedPost.createdAt)}
                    </p>
                  </div>
                )}

                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          handleLike(
                            selectedPost.id,
                            selectedPost.isLiked || false
                          )
                        }
                        className={`flex items-center gap-2 transition-colors ${
                          selectedPost.isLiked
                            ? "text-red-500"
                            : "text-foreground hover:text-red-500"
                        }`}
                      >
                        <Heart
                          className={`h-6 w-6 ${
                            selectedPost.isLiked ? "fill-current" : ""
                          }`}
                        />
                        <span className="text-sm font-semibold">
                          {selectedPost.likesCount || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-foreground">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-sm font-semibold">
                          {selectedPost.commentsCount || 0}
                        </span>
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleBookmark(
                          selectedPost.id,
                          selectedPost.isSaved || false
                        )
                      }
                      className={`transition-colors ${
                        selectedPost.isSaved
                          ? "text-yellow-500"
                          : "text-foreground hover:text-yellow-500"
                      }`}
                    >
                      <Bookmark
                        className={`h-6 w-6 ${
                          selectedPost.isSaved ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoadingComments ? (
                  <CommentsSkeleton />
                ) : comments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={comment.user.imageUrl} />
                            <AvatarFallback>
                              {comment.user.name[0]?.toUpperCase() ||
                                comment.user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  {comment.user.username}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.createdAt)}
                                  </p>
                                  {currentUser && (
                                    <button
                                      onClick={() => {
                                        setReplyingTo(
                                          replyingTo === comment.id
                                            ? null
                                            : comment.id
                                        );
                                        setReplyContent("");
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      {replyingTo === comment.id
                                        ? "Cancel"
                                        : "Reply"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reply input */}
                            {replyingTo === comment.id && (
                              <div className="mt-2 ml-10 space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={replyContent}
                                    onChange={(e) =>
                                      setReplyContent(e.target.value)
                                    }
                                    placeholder="Add a reply..."
                                    className="text-sm"
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        !e.shiftKey &&
                                        replyContent.trim()
                                      ) {
                                        e.preventDefault();
                                        handleSubmitReply(comment.id);
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSubmitReply(comment.id)
                                    }
                                    disabled={
                                      !replyContent.trim() ||
                                      isSubmittingComment
                                    }
                                  >
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 ml-6 space-y-3 border-l-2 pl-4">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-3">
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={reply.user.imageUrl} />
                                      <AvatarFallback>
                                        {reply.user.name[0]?.toUpperCase() ||
                                          reply.user.username[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold">
                                        {reply.user.username}
                                      </p>
                                      <p className="text-sm whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatTimeAgo(reply.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Input - Fixed at bottom */}
              {currentUser && (
                <div className="shrink-0 p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Add a comment..."
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          commentContent.trim()
                        ) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!commentContent.trim() || isSubmittingComment}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </PostDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Name"
              />
            </div>

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

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input
              id="coverImageUrl"
              value={editFormData.coverImageUrl}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  coverImageUrl: e.target.value,
                }))
              }
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Profile Image Upload</Label>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profilePreview || editFormData.imageUrl} />
                <AvatarFallback>
                  {editFormData.name[0]?.toUpperCase() ||
                    editFormData.username[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setProfileFile(file);
                  }}
                  className="w-48"
                />
                {profileFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfileFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image Upload</Label>
            <div className="flex flex-col gap-3">
              <div className="h-24 w-full rounded-md overflow-hidden bg-muted">
                <img
                  src={
                    coverPreview || editFormData.coverImageUrl || coverImageUrl
                  }
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCoverFile(file);
                  }}
                  className="w-48"
                />
                {coverFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Followers Dialog */}
      <Dialog open={isFollowersOpen} onOpenChange={setIsFollowersOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
            <DialogDescription>
              People who follow {userData.username}
            </DialogDescription>
          </DialogHeader>
          {isLoadingFollowers ? (
            <div className="py-6">
              <CommentsSkeleton />
            </div>
          ) : followersList.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No followers yet.
            </div>
          ) : (
            <div className="space-y-3">
              {followersList.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={follower.imageUrl} />
                    <AvatarFallback>
                      {follower.name?.[0]?.toUpperCase() ||
                        follower.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {follower.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {follower.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={isFollowingOpen} onOpenChange={setIsFollowingOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
            <DialogDescription>
              People {userData.username} follows
            </DialogDescription>
          </DialogHeader>
          {isLoadingFollowing ? (
            <div className="py-6">
              <CommentsSkeleton />
            </div>
          ) : followingList.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              Not following anyone yet.
            </div>
          ) : (
            <div className="space-y-3">
              {followingList.map((followed) => (
                <div
                  key={followed.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={followed.imageUrl} />
                    <AvatarFallback>
                      {followed.name?.[0]?.toUpperCase() ||
                        followed.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {followed.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {followed.name}
                    </p>
                  </div>
                  {isOwnProfile && currentUser && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnfollowFromList(followed.username)}
                    >
                      Unfollow
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
