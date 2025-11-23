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
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Repeat2,
  Share,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    username: "RealChiefPriest",
    displayName: "Chief Priest",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChiefPriest",
    postImage: "https://picsum.photos/600/400?random=1",
    content:
      "I want to celebrate the 🐐 Davido's 33rd birthday by giving out 33 million naira to all my followers. Just like this post ❤️ and drop your account number below 👇 #DavidoAt33",
    likes: 17000,
    comments: 5000,
    retweets: 1200,
    views: 548000,
    timeAgo: "21h",
  },
  {
    id: 2,
    username: "johndoe",
    displayName: "John Doe",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    postImage: "https://picsum.photos/600/400?random=2",
    content: "Beautiful sunset today! 🌅 #sunset #nature",
    likes: 1234,
    comments: 89,
    retweets: 45,
    views: 12000,
    timeAgo: "2h",
  },
  {
    id: 3,
    username: "janedoe",
    displayName: "Jane Doe",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    postImage: null,
    content: "Coffee and code ☕️💻 Perfect way to start the day!",
    likes: 567,
    comments: 23,
    retweets: 12,
    views: 8900,
    timeAgo: "5h",
  },
];

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
    createdAt: string;
    expiresAt: string;
  }>;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [isCreateStoryDialogOpen, setIsCreateStoryDialogOpen] = useState(false);
  const [createStoryData, setCreateStoryData] = useState({
    caption: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Get user data from store
  const { userData, getAvatarUrl, getAvatarFallback } = useUserStore();

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

  // Refresh stories after creating a new one
  const refreshStories = async () => {
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
      console.error("Error refreshing stories:", error);
    }
  };

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

  const handleCreateStorySubmit = async () => {
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
        toast.error("Authentication Required", {
          description: "You must be logged in to create a story.",
        });
        return;
      }

      // Determine story type
      let storyType: "text" | "image" | "video" = "text";
      let storyUrl = "";

      // Upload file to Cloudinary if file exists
      if (createStoryData.file) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Check file type
          if (createStoryData.file.type.startsWith("image/")) {
            storyType = "image";
          } else if (createStoryData.file.type.startsWith("video/")) {
            storyType = "video";
          }

          // Get Cloudinary signature
          const { data: response } = await axios.get(
            `${serverUrl}/cloudinary/signature`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                folder: "loop-social-platform/stories",
              },
            }
          );

          const signature = response.data;

          // Determine upload endpoint based on file type
          const uploadType = storyType === "video" ? "video" : "image";
          const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`;

          // Create FormData
          const formData = new FormData();
          formData.append("file", createStoryData.file);
          formData.append("api_key", signature.apiKey);
          formData.append("timestamp", signature.timestamp.toString());
          formData.append("folder", signature.folder);
          formData.append("signature", signature.signature);

          // Upload to Cloudinary
          const { data: uploadResponse } = await axios.post(
            uploadApi,
            formData,
            {
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(progress);
                }
              },
            }
          );

          storyUrl = uploadResponse.secure_url || uploadResponse.url;
          setIsUploading(false);
          setUploadProgress(0);
        } catch (error) {
          setIsUploading(false);
          setUploadProgress(0);
          console.error("Error uploading file:", error);
          const errorMessage =
            axios.isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : "Failed to upload file. Please try again.";
          toast.error("Upload Failed", {
            description: errorMessage,
          });
          return;
        }
      }

      // Prepare request body
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

      // For text stories, caption or url is required
      if (storyType === "text" && !requestBody.caption && !requestBody.url) {
        toast.error("Validation Error", {
          description: "Caption is required for text stories",
        });
        return;
      }

      // Make API call to create story
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
        const result = await response.json();
        console.log("Story created successfully:", result);
        toast.success("Story Created", {
          description: "Your story has been created successfully!",
        });
        handleCreateStoryClose();
        // Refresh stories list
        await refreshStories();
      } else {
        const error = await response.json();
        console.error("Error creating story:", error);
        toast.error("Failed to Create Story", {
          description:
            error.message || "Failed to create story. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating story:", error);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Error", {
        description:
          "An error occurred while creating the story. Please try again.",
      });
    }
  };

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (createStoryData.preview) {
        URL.revokeObjectURL(createStoryData.preview);
      }
    };
  }, [createStoryData.preview]);

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleSave = (postId: number) => {
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:px-8 overflow-x-hidden relative left-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 min-w-0 w-full relative z-0 pb-4">
          {/* Stories Section */}
          <div className="bg-card border border-border p-2 sm:p-3 md:p-4 overflow-hidden relative rounded-lg sm:rounded-none w-full shadow-sm">
            {/* Left Arrow */}
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={() => scrollStories("left")}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={() => scrollStories("right")}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}

            <div
              ref={storiesScrollRef}
              className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
              onScroll={checkScrollButtons}
            >
              {/* Create Story Circle - Always First */}
              {userData && (
                <div
                  className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
                  onClick={() => setIsCreateStoryDialogOpen(true)}
                >
                  <div className="relative p-[2px] rounded-full border-2 border-border">
                    <div className="rounded-full bg-background p-[2px]">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage
                          src={getAvatarUrl()}
                          alt={userData.username || ""}
                        />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {getAvatarFallback()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center">
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
                  const firstStory = storyGroup.stories[0];
                  return (
                    <div
                      key={storyGroup.userId}
                      className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
                      onClick={() => {
                        navigate(
                          `/stories/@${storyGroup.user?.username}/${firstStory.id}`
                        );
                      }}
                    >
                      <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                        <div className="rounded-full bg-background p-[2px]">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                            <AvatarImage
                              src={storyGroup.user.profileImage || ""}
                              alt={storyGroup.user.username || ""}
                            />
                            <AvatarFallback className="text-xs sm:text-sm">
                              {storyGroup.user.firstName?.[0] ||
                                storyGroup.user.username?.[0] ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center">
                        {storyGroup.user.username || "unknown"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
            {mockPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-b border-border hover:bg-accent/5 transition-colors cursor-pointer rounded-lg sm:rounded-none mb-3 sm:mb-0 w-full overflow-hidden shadow-sm"
              >
                <div className="p-2.5 sm:p-3 md:p-4 w-full min-w-0">
                  {/* Post Header */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Avatar
                      className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 shrink-0 cursor-pointer"
                      onClick={() => navigate(`/${post.username}`)}
                    >
                      <AvatarImage src={post.userAvatar} alt={post.username} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {(post.displayName || post.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 flex-wrap">
                        <span
                          className="font-semibold text-xs sm:text-sm hover:underline cursor-pointer truncate"
                          onClick={() => navigate(`/${post.username}`)}
                        >
                          {post.displayName || post.username}
                        </span>
                        <span
                          className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hover:underline cursor-pointer hidden sm:inline"
                          onClick={() => navigate(`/${post.username}`)}
                        >
                          @{post.username}
                        </span>
                        <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hidden sm:inline">
                          ·
                        </span>
                        <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hover:underline">
                          {post.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="text-xs sm:text-sm mb-2 sm:mb-3 whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                    {post.content}
                  </div>

                  {/* Post Image */}
                  {post.postImage && (
                    <div className="rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 border border-border w-full">
                      <img
                        src={post.postImage}
                        alt="Post"
                        className="w-full h-auto object-cover max-w-full"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1 sm:gap-2 w-full min-w-0">
                    <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full flex-1 sm:flex-none h-8 sm:h-9 px-1.5 sm:px-2 md:px-3 min-w-0"
                      >
                        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-1 md:mr-2 shrink-0" />
                        <span className="text-[10px] sm:text-xs md:text-sm hidden min-[375px]:inline truncate">
                          {post.comments.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full flex-1 sm:flex-none h-8 sm:h-9 px-1.5 sm:px-2 md:px-3 min-w-0"
                      >
                        <Repeat2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-1 md:mr-2 shrink-0" />
                        <span className="text-[10px] sm:text-xs md:text-sm hidden min-[375px]:inline truncate">
                          {post.retweets.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id)}
                        className={`rounded-full flex-1 sm:flex-none h-8 sm:h-9 px-1.5 sm:px-2 md:px-3 min-w-0 ${
                          likedPosts.has(post.id)
                            ? "text-red-500 hover:bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 sm:mr-1 md:mr-2 shrink-0 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                        <span className="text-[10px] sm:text-xs md:text-sm hidden min-[375px]:inline truncate">
                          {post.likes.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full hidden sm:flex h-8 sm:h-9 shrink-0"
                      >
                        <Share className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSave(post.id)}
                        className={`rounded-full hidden sm:flex h-8 sm:h-9 shrink-0 ${
                          savedPosts.has(post.id)
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 md:h-5 md:w-5 ${
                            savedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4 md:space-y-6 w-72 xl:w-80">
          {/* Suggestions */}
          <div className="bg-card border rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="font-semibold text-xs md:text-sm text-muted-foreground">
                Suggestions for you
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] md:text-xs h-auto py-1"
              >
                See All
              </Button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {stories.slice(0, 5).map((storyGroup) => {
                if (!storyGroup.user) return null;
                return (
                  <div
                    key={storyGroup.userId}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                        <AvatarImage
                          src={storyGroup.user.profileImage || ""}
                          alt={storyGroup.user.username || ""}
                        />
                        <AvatarFallback className="text-[10px] md:text-xs">
                          {storyGroup.user.firstName?.[0] ||
                            storyGroup.user.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs md:text-sm truncate">
                          {storyGroup.user.username || "unknown"}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                          Suggested for you
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary text-[10px] md:text-xs h-auto py-1 shrink-0"
                    >
                      Follow
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-[10px] md:text-xs text-muted-foreground space-y-1.5 md:space-y-2">
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              <a href="#" className="hover:underline">
                About
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Help
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Press
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                API
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Jobs
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Terms
              </a>
            </div>
            <p className="text-[10px] md:text-xs">© 2024 Loop</p>
          </div>
        </div>
      </div>

      {/* Create Story Dialog */}
      <Dialog
        open={isCreateStoryDialogOpen}
        onOpenChange={setIsCreateStoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[90vh] p-3 sm:p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Share a moment with your story. It will disappear after 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 py-3 sm:py-4 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
            {/* Left Side - Drag and Drop Field */}
            <div className="space-y-2 flex flex-col order-2 sm:order-1">
              <Label className="text-sm sm:text-base">Media (Optional)</Label>
              <div
                className="border-2 border-dashed rounded-lg flex-1 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[250px] sm:min-h-[300px] md:min-h-[400px]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {createStoryData.preview ? (
                  <div className="space-y-3 sm:space-y-4 w-full h-full flex flex-col items-center justify-center p-3 sm:p-4">
                    {createStoryData.file?.type.startsWith("video/") ? (
                      <video
                        src={createStoryData.preview}
                        className="max-h-[250px] sm:max-h-[300px] md:max-h-[400px] max-w-full rounded-lg object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={createStoryData.preview}
                        alt="Preview"
                        className="max-h-[250px] sm:max-h-[300px] md:max-h-[400px] max-w-full rounded-lg object-contain"
                      />
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
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
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 text-center p-4 sm:p-6 md:p-8">
                    <Upload className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">
                        Drag and drop an image or video here, or click to browse
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Supports: JPG, PNG, GIF, MP4
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="story-file-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.getElementById("story-file-upload")?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Caption Field */}
            <div className="flex flex-col h-full order-1 sm:order-2 min-h-[250px] sm:min-h-[300px] md:min-h-0">
              {/* Profile Section */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={getAvatarUrl()} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-xs sm:text-sm truncate">
                  {userData?.username || "You"}
                </span>
              </div>

              {/* Caption Textarea Container */}
              <div className="flex-1 flex flex-col relative bg-muted/30 rounded-lg overflow-hidden">
                <textarea
                  id="story-caption"
                  placeholder="Write a caption... (Optional for media, required for text stories)"
                  value={createStoryData.caption}
                  onChange={(e) =>
                    setCreateStoryData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  maxLength={2200}
                  className="flex-1 w-full bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none"
                />

                {/* Character Count */}
                <div className="flex items-center justify-end px-3 sm:px-4 py-2 sm:py-3 border-t bg-muted/50">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {createStoryData.caption.length.toLocaleString()}/2,200
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:gap-3">
            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCreateStoryClose}
                disabled={isUploading}
                className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateStorySubmit}
                disabled={
                  (!createStoryData.caption.trim() && !createStoryData.file) ||
                  isUploading
                }
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
              >
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Create Story"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
