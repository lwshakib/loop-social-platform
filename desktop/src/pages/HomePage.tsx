import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvatarFallback, getAvatarUrl, UserData } from "@/store/userStore";
import { getAccessToken, getServerUrl } from "@/utils/auth";
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
import { useCallback, useEffect, useRef, useState } from "react";

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

type Post = {
  id: string;
  username: string;
  displayName: string;
  userAvatar: string;
  postImage: string | null;
  postVideo: string | null;
  postType: "text" | "image" | "video";
  content: string;
  likes: number;
  comments: number;
  retweets: number;
  views: number;
  timeAgo: string;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type StoryGroup = {
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  stories: Array<{
    id: string;
    userId: string;
    caption: string;
    url: string;
    type: "text" | "image" | "video";
    createdAt: string;
  }>;
};

export default function HomePage({
  onNavigate,
  onSignOut,
  userData,
}: {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<StoryGroup[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<Set<string>>(
    new Set()
  );
  const [isCreateStoryDialogOpen, setIsCreateStoryDialogOpen] = useState(false);
  const [createStoryData, setCreateStoryData] = useState({
    caption: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  // Fetch stories from API
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const serverUrl = getServerUrl();
        const accessToken = getAccessToken();

        if (!accessToken) {
          setIsLoadingStories(false);
          return;
        }

        const response = await fetch(`${serverUrl}/stories`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

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

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const serverUrl = getServerUrl();
        const accessToken = getAccessToken();

        if (!accessToken) {
          setIsLoadingPosts(false);
          return;
        }

        const response = await fetch(`${serverUrl}/posts?limit=50`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.posts) {
            const transformedPosts: Post[] = result.data.posts.map(
              (post: {
                _id?: string;
                id?: string;
                user?: {
                  firstName?: string;
                  surName?: string;
                  username?: string;
                  profileImage?: string;
                };
                type?: string;
                url?: string;
                caption?: string;
                likesCount?: number;
                commentsCount?: number;
                createdAt: string;
                isLiked?: boolean;
                isSaved?: boolean;
              }) => {
                const user = post.user || {};

                let displayName = "Unknown User";
                if (user.firstName && user.surName) {
                  displayName = `${user.firstName} ${user.surName}`;
                } else if (user.firstName) {
                  displayName = user.firstName;
                } else if (user.username) {
                  displayName = user.username;
                }

                const username =
                  user.username && user.username.trim()
                    ? user.username.trim()
                    : "unknown";

                const id = post._id?.toString() ?? post.id ?? "";

                const postType: Post["postType"] =
                  post.type === "image"
                    ? "image"
                    : post.type === "video"
                    ? "video"
                    : "text";

                return {
                  id,
                  username,
                  displayName,
                  userAvatar: user.profileImage || "",
                  postImage: postType === "image" ? post.url || null : null,
                  postVideo: postType === "video" ? post.url || null : null,
                  postType,
                  content: post.caption || "",
                  likes: post.likesCount || 0,
                  comments: post.commentsCount || 0,
                  retweets: 0,
                  views: 0,
                  timeAgo: formatTimeAgo(post.createdAt),
                  createdAt: post.createdAt,
                  isLiked: post.isLiked || false,
                  isSaved: post.isSaved || false,
                };
              }
            );

            setPosts(transformedPosts);

            const likedPostIds = transformedPosts
              .filter((post) => post.isLiked)
              .map((post) => post.id);
            setLikedPosts(new Set(likedPostIds));

            const savedPostIds = transformedPosts
              .filter((post) => post.isSaved)
              .map((post) => post.id);
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

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const serverUrl = getServerUrl();
        const accessToken = getAccessToken();

        if (!accessToken) {
          return;
        }

        const response = await fetch(`${serverUrl}/users/suggestions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setSuggestedUsers(result.data);

            const followingSet = new Set<string>();
            await Promise.all(
              result.data.slice(0, 10).map(async (userGroup: StoryGroup) => {
                if (!userGroup.user?.username) return;
                try {
                  const userResponse = await fetch(
                    `${serverUrl}/users/${userGroup.user.username}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                      credentials: "include",
                    }
                  );

                  if (userResponse.ok) {
                    const userResult = await userResponse.json();
                    if (userResult.data?.isFollowing && userGroup.userId) {
                      followingSet.add(userGroup.userId);
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error checking following status for ${userGroup.user.username}:`,
                    error
                  );
                }
              })
            );
            setFollowingUserIds(followingSet);
          }
        }
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const handleLike = async (postId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const isLiked = likedPosts.has(postId);
    const serverUrl = getServerUrl();
    const currentPost = posts.find((p) => p.id === postId);
    const previousLikesCount = currentPost?.likes || 0;

    // Optimistic update
    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: Math.max(0, post.likes - 1), isLiked: false }
            : post
        )
      );
    } else {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: post.likes + 1, isLiked: true }
            : post
        )
      );
    }

    try {
      const response = await fetch(`${serverUrl}/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Revert on error
        if (isLiked) {
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
          });
        } else {
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes: previousLikesCount, isLiked: isLiked }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert on error
      if (isLiked) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: previousLikesCount, isLiked: isLiked }
            : post
        )
      );
    }
  };

  const handleSave = async (postId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const isSaved = savedPosts.has(postId);
    const serverUrl = getServerUrl();

    // Optimistic update
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
    }

    try {
      const response = await fetch(`${serverUrl}/posts/${postId}/saved`, {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
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
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isSaved: isSaved } : post
          )
        );
      }
    } catch (error) {
      console.error("Error saving post:", error);
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
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isSaved: isSaved } : post
        )
      );
    }
  };

  // Story creation handlers
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

  const refreshStories = async () => {
    try {
      const serverUrl = getServerUrl();
      const accessToken = getAccessToken();

      if (!accessToken) return;

      const response = await fetch(`${serverUrl}/stories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

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

  const handleCreateStorySubmit = async () => {
    try {
      const serverUrl = getServerUrl();
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.error("Authentication required");
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

          const sigResponse = await fetch(
            `${serverUrl}/cloudinary/signature?folder=loop-social-platform/stories`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const sigResult = await sigResponse.json();
          const signature = sigResult.data;

          const uploadType = storyType === "video" ? "video" : "image";
          const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`;

          const formData = new FormData();
          formData.append("file", createStoryData.file);
          formData.append("api_key", signature.apiKey);
          formData.append("timestamp", signature.timestamp.toString());
          formData.append("folder", signature.folder);
          formData.append("signature", signature.signature);

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded * 100) / event.total);
              setUploadProgress(progress);
            }
          };

          const uploadPromise = new Promise<string>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url || response.url);
              } else {
                reject(new Error("Upload failed"));
              }
            };
            xhr.onerror = () => reject(new Error("Upload failed"));
          });

          xhr.open("POST", uploadApi);
          xhr.send(formData);

          storyUrl = await uploadPromise;
          setIsUploading(false);
          setUploadProgress(0);
        } catch (error) {
          setIsUploading(false);
          setUploadProgress(0);
          console.error("Error uploading file:", error);
          return;
        }
      }

      const requestBody: {
        caption?: string;
        url?: string;
        type: "text" | "image" | "video";
      } = {
        type: storyType,
      };

      if (createStoryData.caption.trim()) {
        requestBody.caption = createStoryData.caption.trim();
      }

      if (storyUrl) {
        requestBody.url = storyUrl;
      }

      if (storyType === "text" && !requestBody.caption && !requestBody.url) {
        console.error("Caption is required for text stories");
        return;
      }

      const response = await fetch(`${serverUrl}/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Story created successfully");
        handleCreateStoryClose();
        await refreshStories();
      } else {
        const error = await response.json();
        console.error("Error creating story:", error);
      }
    } catch (error) {
      console.error("Error creating story:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (createStoryData.preview) {
        URL.revokeObjectURL(createStoryData.preview);
      }
    };
  }, [createStoryData.preview]);

  // Follow user handler
  const handleFollow = async (username: string, userId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const serverUrl = getServerUrl();
    const isCurrentlyFollowing = followingUserIds.has(userId);

    // Optimistic update
    if (isCurrentlyFollowing) {
      setFollowingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      setFollowingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    }

    try {
      const response = await fetch(`${serverUrl}/users/${username}/follow`, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Revert on error
        if (isCurrentlyFollowing) {
          setFollowingUserIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
          });
        } else {
          setFollowingUserIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error("Error following user:", error);
      // Revert on error
      if (isCurrentlyFollowing) {
        setFollowingUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
      } else {
        setFollowingUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    }
  };

  return (

    <Layout
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      userData={userData}
      currentPage="home"
    >
        <div className="w-full max-w-6xl mx-auto px-4 py-6 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
              {/* Stories Section */}
              <div className="bg-card border border-border p-4 overflow-hidden relative rounded-lg shadow-sm">
                {/* Left Arrow */}
                {canScrollLeft && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                    onClick={() => scrollStories("left")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                    onClick={() => scrollStories("right")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}

                <div
                  ref={storiesScrollRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
                  onScroll={checkScrollButtons}
                >
                  {/* Create Story Circle - Always First */}
                  {userData && (
                    <div
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                      onClick={() => setIsCreateStoryDialogOpen(true)}
                    >
                      <div className="relative p-[2px] rounded-full border-2 border-border">
                        <div className="rounded-full bg-background p-[2px]">
                          <Avatar className="h-14 w-14">
                            <AvatarImage
                              src={getAvatarUrl(userData)}
                              alt={userData.username || ""}
                            />
                            <AvatarFallback className="text-sm">
                              {getAvatarFallback(userData)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background">
                          <Plus className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                      <span className="text-xs text-foreground truncate max-w-[70px] text-center">
                        Your story
                      </span>
                    </div>
                  )}

                  {isLoadingStories ? (
                    <div className="flex items-center justify-center w-full py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : stories.length === 0 ? (
                    !userData && (
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
                      return (
                        <div
                          key={storyGroup.userId}
                          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                          onClick={() => {
                            if (storyGroup.user?.username) {
                              onNavigate(`story/${storyGroup.user.username}`);
                            }
                          }}
                        >
                          <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                            <div className="rounded-full bg-background p-[2px]">
                              <Avatar className="h-14 w-14">
                                <AvatarImage
                                  src={storyGroup.user.profileImage || ""}
                                  alt={storyGroup.user.username || ""}
                                />
                                <AvatarFallback className="text-sm">
                                  {storyGroup.user.firstName?.[0] ||
                                    storyGroup.user.username?.[0] ||
                                    "U"}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                          <span className="text-xs text-foreground truncate max-w-[70px] text-center hover:underline">
                            @{storyGroup.user.username || "unknown"}
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
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No posts available</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="border-b border-border hover:bg-accent/5 transition-colors cursor-pointer w-full"
                    >
                      <div className="px-4 py-3 w-full min-w-0">
                        {/* Post Header */}
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar
                            className="h-10 w-10 shrink-0 cursor-pointer"
                            onClick={() =>
                              onNavigate(`profile/${post.username}`)
                            }
                          >
                            <AvatarImage
                              src={post.userAvatar}
                              alt={post.username}
                            />
                            <AvatarFallback className="text-sm">
                              {(post.displayName ||
                                post.username)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="font-bold text-[15px] hover:underline cursor-pointer leading-5"
                                onClick={() =>
                                  onNavigate(`profile/${post.username}`)
                                }
                              >
                                {post.displayName || post.username}
                              </span>
                              <span
                                className="text-[15px] text-muted-foreground hover:underline cursor-pointer leading-5"
                                onClick={() =>
                                  onNavigate(`profile/${post.username}`)
                                }
                              >
                                @{post.username}
                              </span>
                              <span className="text-[15px] text-muted-foreground leading-5">
                                ·
                              </span>
                              <span className="text-[15px] text-muted-foreground hover:underline leading-5">
                                {post.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="text-[15px] mb-3 whitespace-pre-wrap break-words leading-[20px]">
                          {post.content}
                        </div>

                        {/* Post Image or Video */}
                        {post.postImage && (
                          <div className="rounded-2xl overflow-hidden mb-3 w-full">
                            <img
                              src={post.postImage}
                              alt="Post"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        {post.postVideo && (
                          <VideoPlayer
                            src={post.postVideo}
                            videoId={post.id}
                            containerClassName="mb-3 w-full"
                            className="max-h-[600px]"
                            showControls
                            intersectionObserverId={`post-video-${post.id}`}
                          />
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between max-w-[425px] -ml-1 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 group"
                          >
                            <MessageCircle className="h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[13px]">
                              {post.comments >= 1000
                                ? `${(post.comments / 1000).toFixed(1)}K`
                                : post.comments.toLocaleString()}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full h-9 px-2 group"
                          >
                            <Repeat2 className="h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[13px]">
                              {post.retweets >= 1000
                                ? `${(post.retweets / 1000).toFixed(1)}K`
                                : post.retweets.toLocaleString()}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className={`rounded-full h-9 px-2 group ${
                              likedPosts.has(post.id)
                                ? "text-red-500 hover:bg-red-500/10"
                                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            }`}
                          >
                            <Heart
                              className={`h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform ${
                                likedPosts.has(post.id) ? "fill-current" : ""
                              }`}
                            />
                            <span className="text-[13px]">
                              {post.likes >= 1000
                                ? `${(post.likes / 1000).toFixed(1)}K`
                                : post.likes.toLocaleString()}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 group"
                          >
                            <Share className="h-[18.75px] w-[18.75px] group-hover:scale-110 transition-transform" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 group"
                          >
                            <Eye className="h-[18.75px] w-[18.75px] mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[13px]">
                              {post.views >= 1000
                                ? `${(post.views / 1000).toFixed(1)}K`
                                : post.views.toLocaleString()}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSave(post.id)}
                            className={`rounded-full h-9 px-2 group ${
                              savedPosts.has(post.id)
                                ? "text-primary hover:bg-primary/10"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            }`}
                          >
                            <Bookmark
                              className={`h-[18.75px] w-[18.75px] group-hover:scale-110 transition-transform ${
                                savedPosts.has(post.id) ? "fill-current" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block space-y-6 w-72 xl:w-80">
              {/* Suggestions */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-sm text-muted-foreground">
                    Suggestions for you
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto py-1"
                  >
                    See All
                  </Button>
                </div>
                <div className="space-y-3">
                  {suggestedUsers
                    .filter((userGroup) => {
                      if (userData?.id && userGroup.userId === userData.id) {
                        return false;
                      }
                      if (
                        userData?.username &&
                        userGroup.user?.username === userData.username
                      ) {
                        return false;
                      }
                      if (
                        userGroup.userId &&
                        followingUserIds.has(userGroup.userId)
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
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar
                              className="h-8 w-8 shrink-0 cursor-pointer"
                              onClick={() => {
                                if (userGroup.user?.username) {
                                  onNavigate(
                                    `profile/${userGroup.user.username}`
                                  );
                                }
                              }}
                            >
                              <AvatarImage
                                src={userGroup.user.profileImage || ""}
                                alt={userGroup.user.username || ""}
                              />
                              <AvatarFallback className="text-xs">
                                {userGroup.user.firstName?.[0] ||
                                  userGroup.user.username?.[0] ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-semibold text-sm truncate cursor-pointer hover:underline"
                                onClick={() => {
                                  if (userGroup.user?.username) {
                                    onNavigate(
                                      `profile/${userGroup.user.username}`
                                    );
                                  }
                                }}
                              >
                                @{userGroup.user.username || "unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Suggested for you
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary text-xs h-auto py-1 shrink-0"
                            onClick={() => {
                              if (
                                userGroup.user?.username &&
                                userGroup.userId
                              ) {
                                handleFollow(
                                  userGroup.user.username,
                                  userGroup.userId
                                );
                              }
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
        </div>

      {/* Create Story Dialog */}
      <Dialog
        open={isCreateStoryDialogOpen}
        onOpenChange={setIsCreateStoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Share a moment with your story. It will disappear after 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 min-h-[400px]">
            {/* Left Side - Drag and Drop Field */}
 
            <div className="space-y-2 flex flex-col">
              <Label className="text-sm">Media (Optional)</Label>
              <div
                className="border-2 border-dashed rounded-lg flex-1 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[300px]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {createStoryData.preview ? (
                  <div className="space-y-4 w-full h-full flex flex-col items-center justify-center p-4">
                    {createStoryData.file?.type.startsWith("video/") ? (
                      <video
                        src={createStoryData.preview}
                        className="max-h-[300px] max-w-full rounded-lg object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={createStoryData.preview}
                        alt="Preview"
                        className="max-h-[300px] max-w-full rounded-lg object-contain"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
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
                ) : (
                  <div className="space-y-4 text-center p-8">
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Drag and drop an image or video here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports: JPG, PNG, GIF, MP4
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Right Side - Caption Field */}
            <div className="flex flex-col h-full">
              {/* Profile Section */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarUrl(userData)} />
                  <AvatarFallback className="text-sm">
                    {getAvatarFallback(userData)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm truncate">
                  {userData?.username || "You"}
                </span>
              </div>

              {/* Caption Textarea Container */}
              <div className="flex-1 flex flex-col relative bg-muted/30 rounded-lg overflow-hidden">
                <textarea
                  placeholder="Write a caption... (Optional for media, required for text stories)"
                  value={createStoryData.caption}
                  onChange={(e) =>
                    setCreateStoryData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  maxLength={2200}
                  className="flex-1 w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none"
                />

                {/* Character Count */}
                <div className="flex items-center justify-end px-4 py-3 border-t bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    {createStoryData.caption.length.toLocaleString()}/2,200
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-3">
            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCreateStoryClose}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateStorySubmit}
                disabled={
                  (!createStoryData.caption.trim() && !createStoryData.file) ||
                  isUploading
                }
                className="flex-1"
              >
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Create Story"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>

  );
}
