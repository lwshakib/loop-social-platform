import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Bell,
  Check,
  Compass,
  Home,
  Menu,
  MessageCircle,
  Play,
  PlusSquare,
  Search,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

// Instagram Logo Component
const InstagramLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

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

// Mock notifications
const mockNotifications = [
  {
    id: 1,
    type: "like",
    username: "jane_doe",
    fullName: "Jane Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    action: "liked your post",
    time: "2m ago",
    postImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Post1",
    isRead: false,
  },
  {
    id: 2,
    type: "comment",
    username: "john_smith",
    fullName: "John Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    action: "commented on your post",
    comment: "Great post!",
    time: "15m ago",
    postImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Post2",
    isRead: false,
  },
  {
    id: 3,
    type: "follow",
    username: "sarah_wilson",
    fullName: "Sarah Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    action: "started following you",
    time: "1h ago",
    isRead: true,
  },
  {
    id: 4,
    type: "like",
    username: "mike_jones",
    fullName: "Mike Jones",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    action: "liked your post",
    time: "2h ago",
    postImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Post3",
    isRead: true,
  },
  {
    id: 5,
    type: "mention",
    username: "emily_brown",
    fullName: "Emily Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    action: "mentioned you in a comment",
    time: "3h ago",
    isRead: false,
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(mockRecentSearches);
  const [notifications, setNotifications] = useState(mockNotifications);

  const isHomeActive = location.pathname === "/" && !isSearchOpen && !isNotificationsOpen;
  const isExploreActive = location.pathname === "/explore" && !isSearchOpen && !isNotificationsOpen;
  const isReelsActive = location.pathname === "/reels" && !isSearchOpen && !isNotificationsOpen;
  const isMessagesActive = location.pathname === "/messages" && !isSearchOpen && !isNotificationsOpen;

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setIsNotificationsOpen(false);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true);
    setIsSearchOpen(false);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
  };

  const handleHomeClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    navigate("/");
  };

  const handleExploreClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    navigate("/explore");
  };

  const handleReelsClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    navigate("/reels");
  };

  const handleMessagesClick = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    navigate("/messages");
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Navigation */}
      <motion.aside
        className="hidden lg:flex border-r sticky top-0 h-screen z-[70] bg-background"
        style={{ pointerEvents: "auto" }}
        initial={false}
        animate={{
          width: isSearchOpen || isNotificationsOpen ? 384 : 256, // w-96 = 384px, w-64 = 256px
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
                <InstagramLogo className="h-8 w-8" />
              </motion.div>

              {/* Navigation Icons */}
              <nav className="space-y-1 flex-1">
              <Button
                variant="ghost"
                className={`w-full justify-center h-12 ${
                  isHomeActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                style={{ cursor: "pointer" }}
                onClick={handleHomeClick}
              >
                <Home
                  className={`h-6 w-6 ${isHomeActive ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-center h-12 ${
                  (isSearchOpen && !isNotificationsOpen) ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                style={{ cursor: "pointer" }}
                onClick={handleSearchClick}
              >
                <Search
                  className={`h-6 w-6 ${(isSearchOpen && !isNotificationsOpen) ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-center h-12 ${
                  isExploreActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                style={{ cursor: "pointer" }}
                onClick={handleExploreClick}
              >
                <Compass
                  className={`h-6 w-6 ${isExploreActive ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-center h-12 ${
                  isReelsActive ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                style={{ cursor: "pointer" }}
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
                style={{ cursor: "pointer" }}
                onClick={handleMessagesClick}
              >
                <Send
                  className={`h-6 w-6 ${isMessagesActive ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-center h-12 ${
                  isNotificationsOpen ? "bg-accent font-semibold" : ""
                } cursor-pointer`}
                style={{ cursor: "pointer" }}
                onClick={handleNotificationsClick}
              >
                <Bell
                  className={`h-6 w-6 ${isNotificationsOpen ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center h-12 cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                <PlusSquare className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center h-12 cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                <BarChart3 className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center h-12 cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                  <AvatarFallback>YO</AvatarFallback>
                </Avatar>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center h-12 cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                <Menu className="h-6 w-6" />
              </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Column - Menu items or Search */}
        <div className={`${(isSearchOpen || isNotificationsOpen) ? "flex-1" : "w-full"} h-full flex flex-col overflow-hidden relative`}>
          {/* Menu - morphs smoothly */}
          <motion.div
            className="flex flex-col h-full p-4"
            initial={false}
            animate={{
              opacity: (isSearchOpen || isNotificationsOpen) ? 0 : 1,
              width: (isSearchOpen || isNotificationsOpen) ? 0 : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: (isSearchOpen || isNotificationsOpen) ? "absolute" : "relative",
              overflow: "hidden",
              pointerEvents: (isSearchOpen || isNotificationsOpen) ? "none" : "auto",
            }}
          >
                {/* Logo */}
                <motion.div
                  className="mb-8 flex items-center justify-center"
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Loop
                  </h1>
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
                    style={{ cursor: "pointer" }}
                    onClick={handleHomeClick}
                  >
                    <Home
                      className={`h-6 w-6 ${isHomeActive ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Home
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      (isSearchOpen && !isNotificationsOpen) ? "bg-accent font-semibold" : ""
                    } cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={handleSearchClick}
                  >
                    <Search
                      className={`h-6 w-6 ${(isSearchOpen && !isNotificationsOpen) ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Search
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      isExploreActive ? "bg-accent font-semibold" : ""
                    } cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={handleExploreClick}
                  >
                    <Compass
                      className={`h-6 w-6 ${isExploreActive ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Explore
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      isReelsActive ? "bg-accent font-semibold" : ""
                    } cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={handleReelsClick}
                  >
                    <Play
                      className={`h-6 w-6 ${isReelsActive ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Reels
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      isMessagesActive ? "bg-accent font-semibold" : ""
                    } cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={handleMessagesClick}
                  >
                    <Send
                      className={`h-6 w-6 ${isMessagesActive ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Messages
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      isNotificationsOpen ? "bg-accent font-semibold" : ""
                    } cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={handleNotificationsClick}
                  >
                    <Bell
                      className={`h-6 w-6 ${isNotificationsOpen ? "fill-current" : ""}`}
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Notifications
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <PlusSquare className="h-6 w-6" />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Create
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <BarChart3 className="h-6 w-6" />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Dashboard
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                      <AvatarFallback>YO</AvatarFallback>
                    </Avatar>
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      Profile
                    </motion.span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <Menu className="h-6 w-6" />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isSearchOpen || isNotificationsOpen ? 0 : 1,
                        width: isSearchOpen || isNotificationsOpen ? 0 : "auto",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.6,
                      }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      More
                    </motion.span>
                  </Button>
                </motion.nav>
          </motion.div>
          
          {/* Search - morphs smoothly */}
          <motion.div
            className="flex flex-col h-full p-4"
            initial={false}
            animate={{
              opacity: (isSearchOpen && !isNotificationsOpen) ? 1 : 0,
              width: (isSearchOpen && !isNotificationsOpen) ? "100%" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: (isSearchOpen && !isNotificationsOpen) ? "relative" : "absolute",
              overflow: "hidden",
              pointerEvents: (isSearchOpen && !isNotificationsOpen) ? "auto" : "none",
            }}
          >
                {/* Search Header */}
                <motion.div
                  className="mb-8 flex items-center justify-between flex-shrink-0"
                  initial={false}
                  animate={{
                    opacity: (isSearchOpen && !isNotificationsOpen) ? 1 : 0,
                    y: (isSearchOpen && !isNotificationsOpen) ? 0 : -10,
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
                    opacity: (isSearchOpen && !isNotificationsOpen) ? 1 : 0,
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
                </motion.div>
          </motion.div>

          {/* Notifications - morphs smoothly */}
          <motion.div
            className="flex flex-col h-full"
            initial={false}
            animate={{
              opacity: (isNotificationsOpen && !isSearchOpen) ? 1 : 0,
              width: (isNotificationsOpen && !isSearchOpen) ? "100%" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: (isNotificationsOpen && !isSearchOpen) ? "relative" : "absolute",
              overflow: "hidden",
              pointerEvents: (isNotificationsOpen && !isSearchOpen) ? "auto" : "none",
            }}
          >
            {/* Notifications Header */}
            <motion.div
              className="p-4 pb-3 flex items-center justify-between flex-shrink-0 border-b"
              initial={false}
              animate={{
                opacity: (isNotificationsOpen && !isSearchOpen) ? 1 : 0,
                y: (isNotificationsOpen && !isSearchOpen) ? 0 : -10,
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
                opacity: (isNotificationsOpen && !isSearchOpen) ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
              }}
            >
              {notifications.length > 0 ? (
                <div className="p-4 space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-accent/50" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={notification.avatar}
                        alt={notification.username}
                      />
                      <AvatarFallback>
                        {notification.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">
                              {notification.username}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {notification.action}
                            </span>
                          </p>
                          {notification.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              "{notification.comment}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {notification.postImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={notification.postImage}
                              alt="Post"
                              className="w-12 h-12 rounded object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>

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

      {/* Main Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Bottom Messages Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Send className="h-5 w-5" />
          <span>Messages</span>
        </Button>
      </div>
    </div>
  );
}
