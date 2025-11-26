import { Header } from "@/components/Header";
import { ModeToggle } from "@/components/mode-toggle";
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
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Compass,
  Home,
  LogOut,
  Play,
  PlusSquare,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { getAvatarFallback, getAvatarUrl, UserData } from "../store/userStore";
import { getAccessToken, getServerUrl } from "../utils/auth";

// Type for recent search item
type RecentSearch = {
  id: number;
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
  followers: number;
};

// Type for search result user
type SearchUser = {
  id: string;
  firstName?: string;
  surName?: string;
  username: string;
  profileImage?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  bio?: string;
  followers?: number;
};

// Type for notification
type Notification = {
  id: string;
  type: "like" | "comment" | "follow" | "post";
  username: string;
  fullName: string;
  avatar: string;
  action: string;
  comment?: string;
  time: string | Date;
  postImage?: string;
  postId?: string;
  postType?: "text" | "image" | "video";
  isRead: boolean;
};

// Type for raw notification data from API
type ApiNotification = {
  id: string;
  type: string;
  username: string;
  fullName: string;
  avatar?: string;
  action: string;
  comment?: string;
  time: string | Date;
  postImage?: string;
  postId?: string;
  postType?: string;
  isRead: boolean;
};

// Load recent searches from localStorage
const loadRecentSearches = (): RecentSearch[] => {
  try {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading recent searches:", error);
  }
  return [];
};

// Save recent searches to localStorage
const saveRecentSearches = (searches: RecentSearch[]): void => {
  try {
    localStorage.setItem("recentSearches", JSON.stringify(searches));
  } catch (error) {
    console.error("Error saving recent searches:", error);
  }
};

// Helper function to format time ago
const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const notificationDate = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor(
    (now.getTime() - notificationDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

interface LayoutProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
  currentPage: string;
}

// Sidebar Logo Component
const SidebarLogo = ({ showLabel = true }: { showLabel?: boolean }) => (
  <div className="flex items-center gap-1.5 cursor-pointer">
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-4 border-primary/70 bg-transparent">
      <span className="h-1 w-1 rounded-full bg-transparent" />
    </span>
    {showLabel && (
      <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Loop
      </h1>
    )}
  </div>
);

const Layout = ({
  children,
  onNavigate,
  onSignOut,
  userData,
  currentPage,
}: LayoutProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() =>
    loadRecentSearches()
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createPostData, setCreatePostData] = useState({
    caption: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active states based on currentPage and panel states
  const isHomeActive =
    currentPage === "home" && !isSearchOpen && !isNotificationsOpen;
  const isExploreActive =
    currentPage === "explore" && !isSearchOpen && !isNotificationsOpen;
  const isReelsActive =
    currentPage === "reels" && !isSearchOpen && !isNotificationsOpen;
  const isMessagesActive =
    currentPage === "messages" && !isSearchOpen && !isNotificationsOpen;

  // Navigation handlers
  const handleHomeClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    onNavigate("home");
  };

  const handleExploreClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    onNavigate("explore");
  };

  const handleReelsClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    onNavigate("reels");
  };

  const handleMessagesClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    onNavigate("messages");
  };

  const handleProfileClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    onNavigate("profile");
  };

  const handleSignOutClick = () => {
    onSignOut();
    onNavigate("signin");
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setIsNotificationsOpen(false);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true);
    setIsSearchOpen(false);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
  };

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setIsCreateDialogOpen(false);
    setCreatePostData({
      caption: "",
      file: null,
      preview: null,
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const handleRemoveRecent = (id: number) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((search) => search.id !== id);
      saveRecentSearches(updated);
      return updated;
    });
  };

  // Persist recent searches to localStorage whenever they change
  useEffect(() => {
    saveRecentSearches(recentSearches);
  }, [recentSearches]);

  // Fetch notifications
  const fetchNotifications = async () => {
    const serverUrl = getServerUrl();
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    try {
      setIsLoadingNotifications(true);
      const response = await fetch(`${serverUrl}/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.notifications) {
          const transformedNotifications: Notification[] =
            result.data.notifications.map((notif: ApiNotification) => ({
              id: notif.id,
              type: notif.type,
              username: notif.username,
              fullName: notif.fullName,
              avatar: notif.avatar || "",
              action: notif.action,
              comment: notif.comment,
              time: notif.time,
              postImage: notif.postImage,
              postId: notif.postId,
              postType: notif.postType,
              isRead: notif.isRead,
            }));
          setNotifications(transformedNotifications);
          setUnreadNotificationCount(result.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and when notifications panel opens
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  // Search users API call
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      const serverUrl = getServerUrl();
      const accessToken = getAccessToken();

      try {
        setIsSearching(true);
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(
          `${serverUrl}/users/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=20`,
          {
            method: "GET",
            headers,
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setSearchResults(result.data);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserClick = (username: string) => {
    onNavigate(`profile/${username}`);
    setIsSearchOpen(false);
    setSearchQuery("");

    // Add to recent searches
    const userResult = searchResults.find((r) => r.username === username);
    if (userResult) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.username !== username);
        const newSearch: RecentSearch = {
          id: Date.now(),
          username: userResult.username,
          fullName:
            `${userResult.firstName || ""} ${
              userResult.surName || ""
            }`.trim() || userResult.username,
          avatar: userResult.profileImage || "",
          isVerified: userResult.isVerified || false,
          followers: userResult.followers || 0,
        };
        return [newSearch, ...filtered].slice(0, 10);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreatePostData((prev) => ({
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
      setCreatePostData((prev) => ({
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

  const handleSubmit = async () => {
    try {
      const serverUrl = getServerUrl();
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.error("Authentication required");
        handleCreateClose();
        return;
      }

      let postType: "text" | "image" | "video" = "text";
      let postUrl = "";

      // Upload file if exists
      if (createPostData.file) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          if (createPostData.file.type.startsWith("image/")) {
            postType = "image";
          } else if (createPostData.file.type.startsWith("video/")) {
            postType = "video";
          }

          // Get Cloudinary signature
          const sigResponse = await fetch(
            `${serverUrl}/cloudinary/signature?folder=loop-social-platform`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const sigResult = await sigResponse.json();
          const signature = sigResult.data;

          const uploadType = postType === "video" ? "video" : "image";
          const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`;

          const formData = new FormData();
          formData.append("file", createPostData.file);
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

          postUrl = await uploadPromise;
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
        type: postType,
      };

      if (createPostData.caption.trim()) {
        requestBody.caption = createPostData.caption.trim();
      }

      if (postUrl) {
        requestBody.url = postUrl;
      }

      const response = await fetch(`${serverUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Post created successfully");
        handleCreateClose();
      } else {
        const error = await response.json();
        console.error("Error creating post:", error);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (createPostData.preview) {
        URL.revokeObjectURL(createPostData.preview);
      }
    };
  }, [createPostData.preview]);

  return (
    <div className="min-h-screen bg-background flex flex-row w-full overflow-hidden">
      {/* Header with Window Controls */}
      <Header sidebarWidth={isSearchOpen || isNotificationsOpen ? 384 : 256} />

      {/* Left Sidebar Navigation */}
      <motion.aside
        className={`flex border-r fixed left-0 top-0 h-screen z-50 bg-background transition-all shrink-0 ${
          isCreateDialogOpen ? "blur-sm opacity-75 pointer-events-none" : ""
        }`}
        style={{ pointerEvents: isCreateDialogOpen ? "none" : "auto" }}
        initial={false}
        animate={{
          width: isSearchOpen || isNotificationsOpen ? 384 : 256,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* Icons Column - Only visible when search or notifications is open */}
        <AnimatePresence>
          {(isSearchOpen || isNotificationsOpen) && (
            <motion.div
              className="w-20 flex flex-col border-r p-4"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 80 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
                delay: 0.05,
              }}
            >
              {/* Logo */}
              <motion.div
                className="mb-8 flex flex-col items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                  mass: 0.6,
                  delay: 0.1,
                }}
              >
                <SidebarLogo showLabel={false} />
              </motion.div>

              {/* Navigation Icons */}
              <nav className="space-y-1 flex-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isHomeActive ? "bg-accent font-semibold" : ""
                  } cursor-pointer`}
                  onClick={handleHomeClick}
                >
                  <Home
                    className={`h-6 w-6 ${isHomeActive ? "fill-current" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isSearchOpen && !isNotificationsOpen
                      ? "bg-accent font-semibold"
                      : ""
                  } cursor-pointer`}
                  onClick={handleSearchClick}
                >
                  <Search
                    className={`h-6 w-6 ${
                      isSearchOpen && !isNotificationsOpen ? "fill-current" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isExploreActive ? "bg-accent font-semibold" : ""
                  } cursor-pointer`}
                  onClick={handleExploreClick}
                >
                  <Compass
                    className={`h-6 w-6 ${
                      isExploreActive ? "fill-current" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isReelsActive ? "bg-accent font-semibold" : ""
                  } cursor-pointer`}
                  onClick={handleReelsClick}
                >
                  <Play
                    className={`h-6 w-6 ${isReelsActive ? "fill-current" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isMessagesActive ? "bg-accent font-semibold" : ""
                  } cursor-pointer`}
                  onClick={handleMessagesClick}
                >
                  <Send
                    className={`h-6 w-6 ${
                      isMessagesActive ? "fill-current" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-center h-12 ${
                    isNotificationsOpen ? "bg-accent font-semibold" : ""
                  } cursor-pointer`}
                  onClick={handleNotificationsClick}
                >
                  <div className="relative">
                    <Bell
                      className={`h-6 w-6 ${
                        isNotificationsOpen ? "fill-current" : ""
                      }`}
                    />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                        {unreadNotificationCount > 9
                          ? "9+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center h-12 cursor-pointer"
                  onClick={handleCreateClick}
                >
                  <PlusSquare className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center h-12 cursor-pointer"
                  onClick={handleProfileClick}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(userData)} />
                    <AvatarFallback>
                      {getAvatarFallback(userData)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center h-12 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOutClick}
                >
                  <LogOut className="h-6 w-6" />
                </Button>
              </nav>

              {/* Mode Toggle at Bottom */}
              <div className="w-full flex items-center justify-center mt-auto pb-4">
                <ModeToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Column - Menu items or Search/Notifications */}
        <div
          className={`${
            isSearchOpen || isNotificationsOpen ? "flex-1" : "w-full"
          } h-full flex flex-col overflow-hidden relative`}
        >
          {/* Menu - morphs smoothly */}
          <motion.div
            className="flex flex-col h-full p-4 justify-between"
            initial={false}
            animate={{
              opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
              width: isSearchOpen || isNotificationsOpen ? 0 : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position:
                isSearchOpen || isNotificationsOpen ? "absolute" : "relative",
              overflow: "hidden",
              pointerEvents:
                isSearchOpen || isNotificationsOpen ? "none" : "auto",
            }}
          >
            {/* Logo */}
            <motion.div
              className="mb-8 flex items-center justify-start"
              initial={false}
              animate={{
                scale: isSearchOpen || isNotificationsOpen ? 0.9 : 1,
                opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              <SidebarLogo />
            </motion.div>

            {/* Navigation Links */}
            <motion.nav
              className="space-y-1"
              initial={false}
              animate={{
                opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isHomeActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                onClick={handleHomeClick}
              >
                <Home
                  className={`h-6 w-6 ${isHomeActive ? "fill-current" : ""}`}
                />
                <span>Home</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isSearchOpen && !isNotificationsOpen
                    ? "bg-accent font-semibold"
                    : ""
                } cursor-pointer`}
                onClick={handleSearchClick}
              >
                <Search
                  className={`h-6 w-6 ${
                    isSearchOpen && !isNotificationsOpen ? "fill-current" : ""
                  }`}
                />
                <span>Search</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isExploreActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                onClick={handleExploreClick}
              >
                <Compass
                  className={`h-6 w-6 ${isExploreActive ? "fill-current" : ""}`}
                />
                <span>Explore</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isReelsActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                onClick={handleReelsClick}
              >
                <Play
                  className={`h-6 w-6 ${isReelsActive ? "fill-current" : ""}`}
                />
                <span>Reels</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isMessagesActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                onClick={handleMessagesClick}
              >
                <Send
                  className={`h-6 w-6 ${
                    isMessagesActive ? "fill-current" : ""
                  }`}
                />
                <span>Messages</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base ${
                  isNotificationsOpen ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                onClick={handleNotificationsClick}
              >
                <div className="relative">
                  <Bell
                    className={`h-6 w-6 ${
                      isNotificationsOpen ? "fill-current" : ""
                    }`}
                  />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                      {unreadNotificationCount > 9
                        ? "9+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base cursor-pointer"
                onClick={handleCreateClick}
              >
                <PlusSquare className="h-6 w-6" />
                <span>Create</span>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 text-base cursor-pointer ${
                  currentPage === "profile" ? "bg-accent font-semibold" : ""
                }`}
                onClick={handleProfileClick}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={getAvatarUrl(userData)} />
                  <AvatarFallback>{getAvatarFallback(userData)}</AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOutClick}
              >
                <LogOut className="h-6 w-6" />
                <span>Sign Out</span>
              </Button>
            </motion.nav>

            {/* Mode Toggle at Bottom */}
            <div
              className="w-full flex items-center justify-start gap-3 h-12 mt-auto"
              style={{
                opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                pointerEvents:
                  isSearchOpen || isNotificationsOpen ? "none" : "auto",
              }}
            >
              <ModeToggle />
            </div>
          </motion.div>

          {/* Search Panel */}
          <motion.div
            className="flex flex-col h-full p-4"
            initial={false}
            animate={{
              opacity: isSearchOpen && !isNotificationsOpen ? 1 : 0,
              width: isSearchOpen && !isNotificationsOpen ? "100%" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position:
                isSearchOpen && !isNotificationsOpen ? "relative" : "absolute",
              overflow: "hidden",
              pointerEvents:
                isSearchOpen && !isNotificationsOpen ? "auto" : "none",
            }}
          >
            {/* Search Header */}
            <motion.div
              className="mb-8 flex items-center justify-between shrink-0"
              initial={false}
              animate={{
                opacity: isSearchOpen && !isNotificationsOpen ? 1 : 0,
                y: isSearchOpen && !isNotificationsOpen ? 0 : -10,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              <h2 className="text-xl font-semibold">Search</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Search Interface */}
            <motion.div
              className="flex-1 overflow-hidden space-y-4 min-h-0"
              initial={false}
              animate={{
                opacity: isSearchOpen && !isNotificationsOpen ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              {/* Search Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 px-3"
                  autoFocus={isSearchOpen}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handleUserClick(user.username)}
                        >
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.username || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium">
                                {user.username?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm truncate">{user.username}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}

              {/* Recent Searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Recent</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearRecent}
                      className="text-primary text-xs h-auto py-1"
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer group"
                        onClick={() => {
                          onNavigate(`profile/${search.username}`);
                          setIsSearchOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {search.avatar ? (
                              <img
                                src={search.avatar}
                                alt={search.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium">
                                {search.username[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm truncate">{search.username}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecent(search.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!searchQuery && recentSearches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No recent searches</p>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Notifications Panel */}
          <motion.div
            className="flex flex-col h-full p-4"
            initial={false}
            animate={{
              opacity: isNotificationsOpen ? 1 : 0,
              width: isNotificationsOpen ? "100%" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: isNotificationsOpen ? "relative" : "absolute",
              overflow: "hidden",
              pointerEvents: isNotificationsOpen ? "auto" : "none",
            }}
          >
            {/* Notifications Header */}
            <motion.div
              className="mb-8 flex items-center justify-between shrink-0"
              initial={false}
              animate={{
                opacity: isNotificationsOpen ? 1 : 0,
                y: isNotificationsOpen ? 0 : -10,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              <h2 className="text-xl font-semibold">Notifications</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNotificationsClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Notifications List */}
            <motion.div
              className="flex-1 overflow-y-auto min-h-0"
              initial={false}
              animate={{
                opacity: isNotificationsOpen ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer ${
                        !notification.isRead ? "bg-accent/50" : ""
                      }`}
                      onClick={() => {
                        if (notification.postId) {
                          onNavigate(`post/${notification.postId}`);
                        } else {
                          onNavigate(`profile/${notification.username}`);
                        }
                        setIsNotificationsOpen(false);
                      }}
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt={notification.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {notification.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {notification.username}
                          </span>{" "}
                          {notification.action}
                        </p>
                        {notification.comment && (
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.time)}
                        </p>
                      </div>
                      {notification.postImage && (
                        <div className="h-10 w-10 rounded overflow-hidden shrink-0">
                          <img
                            src={notification.postImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="flex-1 flex flex-col overflow-hidden"
        initial={false}
        animate={{
          marginLeft: isSearchOpen || isNotificationsOpen ? 384 : 256,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
      >
        <div className="flex-1 overflow-y-auto pt-12">{children}</div>
      </motion.main>

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new post</DialogTitle>
            <DialogDescription>
              Share a photo, video, or text with your followers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload Area */}
            {!createPostData.preview ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag photos and videos here
                </p>
                <Button variant="secondary" size="sm">
                  Select from computer
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                {createPostData.file?.type.startsWith("video/") ? (
                  <video
                    src={createPostData.preview}
                    className="w-full rounded-lg max-h-64 object-contain bg-black"
                    controls
                  />
                ) : (
                  <img
                    src={createPostData.preview}
                    alt="Preview"
                    className="w-full rounded-lg max-h-64 object-contain bg-black"
                  />
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() =>
                    setCreatePostData((prev) => ({
                      ...prev,
                      file: null,
                      preview: null,
                    }))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <textarea
                id="caption"
                placeholder="Write a caption..."
                value={createPostData.caption}
                onChange={(e) =>
                  setCreatePostData((prev) => ({
                    ...prev,
                    caption: e.target.value,
                  }))
                }
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCreateClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isUploading ||
                (!createPostData.caption.trim() && !createPostData.file)
              }
            >
              {isUploading ? "Uploading..." : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
