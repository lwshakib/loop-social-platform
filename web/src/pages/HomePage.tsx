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
    <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories Section */}
          <div className="bg-card p-4 overflow-hidden relative">
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
              className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={checkScrollButtons}
            >
                {mockStories.map((story) => (
                  <div
                    key={story.id}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                  <div className="relative p-[2px] rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-500">
                    <div className="rounded-full bg-background p-[2px]">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={story.avatar} alt={story.username} />
                            <AvatarFallback>{story.username[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                  <span className="text-xs text-foreground truncate max-w-[70px] text-center">
                      {story.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Posts */}
            {mockPosts.map((post) => (
              <div
                key={post.id}
              className="bg-card border-b hover:bg-accent/5 transition-colors cursor-pointer"
              >
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar 
                    className="h-12 w-12 shrink-0 cursor-pointer"
                    onClick={() => navigate(`/${post.username}`)}
                  >
                      <AvatarImage src={post.userAvatar} alt={post.username} />
                    <AvatarFallback>
                      {(post.displayName || post.username)[0].toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-semibold text-sm hover:underline cursor-pointer"
                        onClick={() => navigate(`/${post.username}`)}
                      >
                        {post.displayName || post.username}
                      </span>
                      <span 
                        className="text-sm text-muted-foreground hover:underline cursor-pointer"
                        onClick={() => navigate(`/${post.username}`)}
                      >
                        @{post.username}
                      </span>
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground hover:underline">
                        {post.timeAgo}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div className="text-sm mb-3 whitespace-pre-wrap wrap-break-word">
                      {post.content}
                </div>

                {/* Post Image */}
                    {post.postImage && (
                      <div className="rounded-2xl overflow-hidden mb-3 border border-border">
                  <img
                    src={post.postImage}
                          alt="Post"
                          className="w-full h-auto object-cover"
                  />
                </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between max-w-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm">
                          {post.comments.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full"
                      >
                        <Repeat2 className="h-5 w-5 mr-2" />
                        <span className="text-sm">
                          {post.retweets.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id)}
                        className={`rounded-full ${
                          likedPosts.has(post.id)
                            ? "text-red-500 hover:bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 mr-2 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                        <span className="text-sm">
                          {post.likes.toLocaleString()}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full"
                      >
                        <Share className="h-5 w-5" />
                      </Button>
                    <Button
                      variant="ghost"
                        size="sm"
                      onClick={() => toggleSave(post.id)}
                        className={`rounded-full ${
                          savedPosts.has(post.id)
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                    >
                      <Bookmark
                          className={`h-5 w-5 ${
                          savedPosts.has(post.id) ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  </div>
                    <Button
                      variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                    <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block space-y-6 w-80">
            {/* User Profile */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                  <AvatarFallback>YO</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">your_username</p>
                  <p className="text-sm text-muted-foreground">Your Name</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  Switch
                </Button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm text-muted-foreground">
                  Suggestions for you
                </p>
                <Button variant="ghost" size="sm" className="text-xs">
                  See All
                </Button>
              </div>
              <div className="space-y-3">
                {mockStories.slice(0, 5).map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={story.avatar} alt={story.username} />
                        <AvatarFallback>{story.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                      <p className="font-semibold text-sm">{story.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Suggested for you
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary text-xs"
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex flex-wrap gap-2">
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
              <p className="text-xs">© 2024 Loop</p>
            </div>
          </div>
        </div>
    </div>
  );
}
