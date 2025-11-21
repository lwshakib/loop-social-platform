import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BarChart3,
  Bell,
  Bookmark,
  Check,
  Compass,
  Heart,
  Home,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  PlusSquare,
  Search,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    username: "johndoe",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    postImage: "https://picsum.photos/600/600?random=1",
    likes: 1234,
    caption: "Beautiful sunset today! 🌅 #sunset #nature",
    comments: [
      { username: "janedoe", text: "Amazing!" },
      { username: "bob", text: "Love this!" },
    ],
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    username: "janedoe",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    postImage: "https://picsum.photos/600/600?random=2",
    likes: 567,
    caption: "Coffee and code ☕️💻",
    comments: [{ username: "johndoe", text: "Same here!" }],
    timeAgo: "5 hours ago",
  },
  {
    id: 3,
    username: "bob",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    postImage: "https://picsum.photos/600/600?random=3",
    likes: 890,
    caption: "Weekend vibes 🎉",
    comments: [],
    timeAgo: "1 day ago",
  },
];

// Mock stories
const mockStories = [
  {
    id: 1,
    username: "johndoe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  {
    id: 2,
    username: "janedoe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  },
  {
    id: 3,
    username: "bob",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: 4,
    username: "alice",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: 5,
    username: "charlie",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
];

// Mock recent searches
const mockRecentSearches = [
  {
    id: 1,
    username: "dr.mizanur.rahman.azhari",
    fullName: "Dr. Mizanur Rahman Azhari",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mizanur",
    followers: "530K",
    isVerified: true,
  },
];

export default function HomePage() {
  const location = useLocation();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(mockRecentSearches);

  const isHomeActive = location.pathname === "/" && !isSearchOpen;

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setIsSidebarCollapsed(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setIsSidebarCollapsed(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecent = (id: number) => {
    setRecentSearches((prev) => prev.filter((search) => search.id !== id));
  };

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
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Navigation */}
      <aside
        className={`hidden lg:flex flex-col border-r sticky top-0 h-screen transition-all duration-300 z-[60] bg-background ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4">
          {/* Logo */}
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-8">
              Loop
            </h1>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isHomeActive ? "bg-accent font-semibold" : ""
              }`}
            >
              <Home
                className={`h-6 w-6 ${isHomeActive ? "fill-current" : ""}`}
              />
              <span>Home</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSearchOpen ? "bg-accent font-semibold" : ""
              } ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
              onClick={handleSearchClick}
            >
              <Search
                className={`h-6 w-6 ${isSearchOpen ? "fill-current" : ""}`}
              />
              {!isSidebarCollapsed && <span>Search</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Compass className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Explore</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Play className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Reels</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Send className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Messages</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Bell className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Notifications</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <PlusSquare className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Create</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <BarChart3 className="h-6 w-6" />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              {!isSidebarCollapsed && <span>Profile</span>}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 text-base ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Menu className="h-6 w-6" />
              {!isSidebarCollapsed && <span>More</span>}
            </Button>
          </nav>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loop
          </h1>
          <Button variant="ghost" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6 max-w-2xl">
            {/* Stories Section */}
            <div className="bg-card border rounded-lg p-4 overflow-hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {mockStories.map((story) => (
                  <div
                    key={story.id}
                    className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                        <div className="bg-background rounded-full p-0.5">
                          <Avatar className="h-16 w-16 border-2 border-background">
                            <AvatarImage
                              src={story.avatar}
                              alt={story.username}
                            />
                            <AvatarFallback>{story.username[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs truncate max-w-[70px]">
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
                className="bg-card border rounded-lg overflow-hidden"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.userAvatar} alt={post.username} />
                      <AvatarFallback>{post.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{post.username}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {/* Post Image */}
                <div className="aspect-square w-full bg-muted">
                  <img
                    src={post.postImage}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Post Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleLike(post.id)}
                        className={
                          likedPosts.has(post.id) ? "text-red-500" : ""
                        }
                      >
                        <Heart
                          className={`h-6 w-6 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MessageCircle className="h-6 w-6" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Send className="h-6 w-6" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSave(post.id)}
                      className={savedPosts.has(post.id) ? "text-primary" : ""}
                    >
                      <Bookmark
                        className={`h-6 w-6 ${
                          savedPosts.has(post.id) ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                  </div>

                  {/* Likes Count */}
                  <p className="font-semibold text-sm">
                    {post.likes.toLocaleString()} likes
                  </p>

                  {/* Caption */}
                  <div className="text-sm">
                    <span className="font-semibold">{post.username}</span>{" "}
                    <span>{post.caption}</span>
                  </div>

                  {/* View Comments */}
                  {post.comments.length > 0 && (
                    <button className="text-sm text-muted-foreground">
                      View all {post.comments.length} comments
                    </button>
                  )}

                  {/* Comments Preview */}
                  {post.comments.slice(0, 2).map((comment, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold">{comment.username}</span>{" "}
                      <span>{comment.text}</span>
                    </div>
                  ))}

                  {/* Time Ago */}
                  <p className="text-xs text-muted-foreground uppercase">
                    {post.timeAgo}
                  </p>

                  {/* Add Comment */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Input
                      type="text"
                      placeholder="Add a comment..."
                      className="border-0 bg-transparent focus-visible:ring-0 text-sm h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary px-2"
                    >
                      Post
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
                        <p className="font-semibold text-sm">
                          {story.username}
                        </p>
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

      {/* Bottom Messages Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Send className="h-5 w-5" />
          <span>Messages</span>
        </Button>
      </div>

      {/* Search Drawer */}
      <Sheet open={isSearchOpen} onOpenChange={handleSearchClose}>
        <SheetContent
          side="left"
          className="w-full sm:w-96 p-0 z-[40]"
          overlayClassName="z-[40]"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-xl font-semibold">Search</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 bg-muted/50"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !searchQuery && (
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
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={search.avatar}
                            alt={search.username}
                          />
                          <AvatarFallback>
                            {search.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-sm truncate">
                              {search.username}
                            </p>
                            {search.isVerified && (
                              <Check className="h-4 w-4 text-blue-500 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <p className="truncate">{search.fullName}</p>
                            <span>·</span>
                            <p>{search.followers} followers</p>
                          </div>
                        </div>
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

            {/* Search Results (when typing) */}
            {searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No results found</p>
              </div>
            )}

            {/* Empty State */}
            {recentSearches.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent searches</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
