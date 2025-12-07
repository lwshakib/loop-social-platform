"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useSocialStore } from "@/context";
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

type TabType = "posts" | "reels" | "liked" | "saved";

type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string;
  type: "text" | "image" | "video";
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
  dateOfBirth: string;
  gender: string;
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
  const params = useParams();
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const username = params?.username as string;

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
    name: "",
    username: "",
    bio: "",
    imageUrl: "",
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  // Remove @ symbol if present in username
  const cleanUsername = username?.startsWith("@")
    ? username.slice(1)
    : username || "";

  // Check if this is the current user's profile
  const isOwnProfile =
    currentUser?.username.toLowerCase() === cleanUsername.toLowerCase();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!cleanUsername) return;

      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // For now, use mock data
        const mockUserData: UserData = {
          id: "1",
          username: cleanUsername,
          name: "User Name",
          email: "user@example.com",
          bio: "This is a bio",
          imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          dateOfBirth: "",
          gender: "",
          isVerified: false,
          createdAt: new Date().toISOString(),
          postsCount: 0,
          followers: 0,
          following: 0,
          isFollowing: false,
        };
        setUserData(mockUserData);
        setIsFollowing(mockUserData.isFollowing || false);
      } catch (error) {
        console.error("Error fetching user data:", error);
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
        // TODO: Replace with actual API call
        // For now, use mock data
        const mockPosts: Post[] = [];
        setPosts(mockPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
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
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // TODO: Implement actual update API call
      console.log("Updating profile:", editFormData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleFollow = async () => {
    // TODO: Implement follow/unfollow API call
    setIsFollowing(!isFollowing);
    setUserData((prev) =>
      prev
        ? {
            ...prev,
            followers: isFollowing
              ? Math.max(0, prev.followers - 1)
              : prev.followers + 1,
          }
        : null
    );
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

  const avatarUrl =
    userData.imageUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;
  const coverImageUrl = "https://picsum.photos/800/300?random=profile";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-r from-blue-500 to-purple-500">
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
            {userData.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            @{userData.username}
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
          <button className="hover:underline shrink-0">
            <span className="font-semibold text-foreground">
              {userData.following.toLocaleString()}
            </span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button className="hover:underline shrink-0">
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
                }}
              >
                {post.imageUrl ? (
                  post.type === "video" ? (
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
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {selectedPost && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Media Section */}
              <div className="relative w-full md:w-1/2 bg-black flex items-center justify-center overflow-hidden aspect-square md:aspect-auto">
                {selectedPost.imageUrl ? (
                  selectedPost.type === "video" ? (
                    <video
                      src={selectedPost.imageUrl}
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={selectedPost.imageUrl}
                      alt="Post"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-8 text-white">
                    <p className="text-sm">{selectedPost.content || "Post"}</p>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
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
                        @{userData.username}
                      </p>
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
                      <button className="flex items-center gap-2">
                        <Heart className="h-6 w-6" />
                        <span className="text-sm font-semibold">
                          {selectedPost.likesCount || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-sm font-semibold">
                          {selectedPost.commentsCount || 0}
                        </span>
                      </button>
                    </div>
                    <button>
                      <Bookmark className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
