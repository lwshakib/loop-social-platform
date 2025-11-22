import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

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

// Mock stories
const mockStories = [
  {
    id: 1,
    username: "mr_ng_39",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mr_ng_39",
  },
  {
    id: 2,
    username: "addicted._....",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=addicted",
  },
  {
    id: 3,
    username: "its_rhythm...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rhythm",
  },
  {
    id: 4,
    username: "nintaidzuy...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nintaidzuy",
  },
  {
    id: 5,
    username: "muhtashi...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=muhtashi",
  },
  {
    id: 6,
    username: "marsplane...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marsplane",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
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
              {mockStories.map((story) => (
                <div
                  key={story.id}
                  className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
                >
                  <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                    <div className="rounded-full bg-background p-[2px]">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage src={story.avatar} alt={story.username} />
                        <AvatarFallback className="text-xs sm:text-sm">{story.username[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center">
                    {story.username}
                  </span>
                </div>
              ))}
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
          {/* User Profile */}
          <div className="bg-card border rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar className="h-12 w-12 md:h-14 md:w-14">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                <AvatarFallback className="text-xs md:text-sm">YO</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs md:text-sm truncate">your_username</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Your Name</p>
              </div>
              <Button variant="ghost" size="sm" className="text-primary text-xs md:text-sm shrink-0">
                Switch
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-card border rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="font-semibold text-xs md:text-sm text-muted-foreground">
                Suggestions for you
              </p>
              <Button variant="ghost" size="sm" className="text-[10px] md:text-xs h-auto py-1">
                See All
              </Button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {mockStories.slice(0, 5).map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                      <AvatarImage src={story.avatar} alt={story.username} />
                      <AvatarFallback className="text-[10px] md:text-xs">{story.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs md:text-sm truncate">{story.username}</p>
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
              ))}
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
    </div>
  );
}
