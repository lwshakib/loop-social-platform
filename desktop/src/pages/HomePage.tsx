import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Play,
  Plus,
  PlusSquare,
  Repeat2,
  Send,
  Share,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ModeToggle } from "../components/mode-toggle";
import { WindowControls } from "../components/WindowControls";
import { UserData, getAvatarFallback, getAvatarUrl } from "../store/userStore";
import { getAccessToken, getServerUrl } from "../utils/auth";

type HomePageProps = {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
};

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

export default function HomePage({ onSignOut, userData }: HomePageProps) {
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

                return {
                  id: post._id?.toString() || post.id,
                  username,
                  displayName,
                  userAvatar: user.profileImage || "",
                  postImage: post.type === "image" ? post.url : null,
                  postVideo: post.type === "video" ? post.url : null,
                  postType: post.type || "text",
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Window Controls - Fixed at top */}
      <div className="fixed top-4 right-4 z-50">
        <WindowControls />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col p-4">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loop
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md bg-accent font-semibold text-base hover:bg-accent/80 transition-colors">
            <Home className="h-6 w-6 fill-current" />
            <span>Home</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <Compass className="h-6 w-6" />
            <span>Explore</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <Play className="h-6 w-6" />
            <span>Reels</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <Send className="h-6 w-6" />
            <span>Messages</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <Bell className="h-6 w-6" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <PlusSquare className="h-6 w-6" />
            <span>Create</span>
          </button>
          <button className="w-full flex items-center gap-3 h-12 px-3 rounded-md text-base hover:bg-accent transition-colors">
            <User className="h-6 w-6" />
            <span>Profile</span>
          </button>
        </nav>

        {/* User Profile & Actions at Bottom */}
        <div className="mt-auto pt-4 space-y-2">
          {/* User Info */}
          {userData && (
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {userData.profileImage ? (
                  <img
                    src={getAvatarUrl(userData)}
                    alt={userData.username || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {getAvatarFallback(userData)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {userData.firstName || userData.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{userData.username || "username"}
                </p>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <button
              onClick={onSignOut}
              className="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-md text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Stories Section */}
          <div className="bg-card border rounded-lg p-4 mb-6 relative">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollStories("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={() => scrollStories("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md flex items-center justify-center"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <div
              ref={storiesScrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={checkScrollButtons}
            >
              {/* Your Story */}
              {userData && (
                <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer">
                  <div className="relative p-[2px] rounded-full border-2 border-border">
                    <div className="rounded-full bg-background p-[2px]">
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {userData.profileImage ? (
                          <img
                            src={getAvatarUrl(userData)}
                            alt={userData.username || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {getAvatarFallback(userData)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background">
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-xs text-center max-w-[70px] truncate">
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
                      className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                        <div className="rounded-full bg-background p-[2px]">
                          <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            {storyGroup.user.profileImage ? (
                              <img
                                src={storyGroup.user.profileImage}
                                alt={storyGroup.user.username || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">
                                {storyGroup.user.firstName?.[0] ||
                                  storyGroup.user.username?.[0] ||
                                  "U"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-center max-w-[70px] truncate">
                        @{storyGroup.user.username || "unknown"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-0">
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
                  className="border-b border-border hover:bg-accent/5 transition-colors"
                >
                  <div className="px-4 py-3">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {post.userAvatar ? (
                          <img
                            src={post.userAvatar}
                            alt={post.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {(post.displayName ||
                              post.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[15px] leading-5">
                            {post.displayName || post.username}
                          </span>
                          <span className="text-[15px] text-muted-foreground leading-5">
                            @{post.username}
                          </span>
                          <span className="text-[15px] text-muted-foreground leading-5">
                            ·
                          </span>
                          <span className="text-[15px] text-muted-foreground leading-5">
                            {post.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="text-[15px] mb-3 whitespace-pre-wrap break-words leading-[20px]">
                      {post.content}
                    </div>

                    {/* Post Image */}
                    {post.postImage && (
                      <div className="rounded-2xl overflow-hidden mb-3">
                        <img
                          src={post.postImage}
                          alt="Post"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {/* Post Video */}
                    {post.postVideo && (
                      <div className="rounded-2xl overflow-hidden mb-3 bg-black">
                        <video
                          src={post.postVideo}
                          controls
                          className="w-full max-h-[600px] object-contain"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between max-w-[425px] -ml-1 mt-1">
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 transition-colors">
                        <MessageCircle className="h-[18.75px] w-[18.75px]" />
                        <span className="text-[13px]">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full h-9 px-2 transition-colors">
                        <Repeat2 className="h-[18.75px] w-[18.75px]" />
                        <span className="text-[13px]">{post.retweets}</span>
                      </button>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 rounded-full h-9 px-2 transition-colors ${
                          likedPosts.has(post.id)
                            ? "text-red-500 hover:bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Heart
                          className={`h-[18.75px] w-[18.75px] ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                        <span className="text-[13px]">{post.likes}</span>
                      </button>
                      <button className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 transition-colors">
                        <Share className="h-[18.75px] w-[18.75px]" />
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full h-9 px-2 transition-colors">
                        <Eye className="h-[18.75px] w-[18.75px]" />
                        <span className="text-[13px]">{post.views}</span>
                      </button>
                      <button
                        onClick={() => handleSave(post.id)}
                        className={`rounded-full h-9 px-2 transition-colors ${
                          savedPosts.has(post.id)
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                      >
                        <Bookmark
                          className={`h-[18.75px] w-[18.75px] ${
                            savedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Suggestions */}
      <aside className="w-80 border-l p-4 overflow-y-auto">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Suggestions for you
            </h3>
            <button className="text-xs h-auto py-1 hover:underline">
              See All
            </button>
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
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {userGroup.user.profileImage ? (
                          <img
                            src={userGroup.user.profileImage}
                            alt={userGroup.user.username || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">
                            {userGroup.user.firstName?.[0] ||
                              userGroup.user.username?.[0] ||
                              "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          @{userGroup.user.username || "unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Suggested for you
                        </p>
                      </div>
                    </div>
                    <button className="text-primary text-xs font-semibold hover:text-primary/80 shrink-0">
                      {followingUserIds.has(userGroup.userId)
                        ? "Following"
                        : "Follow"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </aside>
    </div>
  );
}
