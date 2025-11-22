import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Bookmark,
  Calendar,
  Edit,
  Grid3x3,
  Heart,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Play,
  Repeat2,
  Settings,
  Share,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type TabType = "posts" | "reels" | "liked";

type BasePost = {
  id: number;
  postImage: string | null;
  content: string;
  likes: number;
  comments: number;
  retweets: number;
  views: number;
  timeAgo: string;
  type: "text" | "image" | "video";
};

type LikedPost = BasePost & {
  likedBy: string;
};

type VideoPost = BasePost & {
  type: "video";
  duration: string;
};

// Mock user data - in production, this would come from an API
const mockUserData = {
  id: "1",
  username: "johndoe",
  displayName: "John Doe",
  bio: "Software Developer | Coffee Enthusiast | Traveler 🌍",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  coverImage: "https://picsum.photos/800/300?random=profile",
  location: "San Francisco, CA",
  website: "https://johndoe.dev",
  joinDate: "January 2020",
  following: 234,
  followers: 1234,
  posts: 567,
  isFollowing: false,
  isOwnProfile: false,
};

// Mock posts for profile
const mockProfilePosts: BasePost[] = [
  {
    id: 1,
    postImage: "https://picsum.photos/600/400?random=1",
    content: "Beautiful sunset today! 🌅 #sunset #nature",
    likes: 1234,
    comments: 89,
    retweets: 45,
    views: 12000,
    timeAgo: "2h",
    type: "image" as const,
  },
  {
    id: 2,
    postImage: null,
    content: "Coffee and code ☕️💻 Perfect way to start the day!",
    likes: 567,
    comments: 23,
    retweets: 12,
    views: 8900,
    timeAgo: "5h",
    type: "text" as const,
  },
  {
    id: 3,
    postImage: "https://picsum.photos/600/400?random=3",
    content: "Working on a new project! Stay tuned 🚀",
    likes: 890,
    comments: 45,
    retweets: 23,
    views: 15000,
    timeAgo: "1d",
    type: "image" as const,
  },
];

// Mock reels/videos
const mockReels: VideoPost[] = [
  {
    id: 6,
    postImage: "https://picsum.photos/600/800?random=6",
    content: "Check out this amazing sunset! 🌅",
    likes: 5678,
    comments: 234,
    retweets: 89,
    views: 45000,
    timeAgo: "1d",
    type: "video" as const,
    duration: "0:45",
  },
  {
    id: 7,
    postImage: "https://picsum.photos/600/800?random=7",
    content: "Behind the scenes of my latest project 🎬",
    likes: 3456,
    comments: 156,
    retweets: 67,
    views: 32000,
    timeAgo: "2d",
    type: "video" as const,
    duration: "1:20",
  },
];

// Mock liked posts
const mockLikedPosts: LikedPost[] = [
  {
    id: 8,
    postImage: "https://picsum.photos/600/400?random=8",
    content: "This is an amazing post I liked! 🔥",
    likes: 8900,
    comments: 567,
    retweets: 234,
    views: 89000,
    timeAgo: "4h",
    type: "image" as const,
    likedBy: "@johndoe",
  },
  {
    id: 9,
    postImage: null,
    content: "Such an inspiring message! 💪",
    likes: 1234,
    comments: 89,
    retweets: 45,
    views: 12000,
    timeAgo: "8h",
    type: "text" as const,
    likedBy: "@johndoe",
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [isFollowing, setIsFollowing] = useState(mockUserData.isFollowing);

  // Remove @ symbol if present in username (for future use when fetching real data)
  // const cleanUsername = username?.startsWith("@") ? username.slice(1) : username;

  // In production, fetch user data based on username
  const userData = mockUserData;

  // Get content based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case "posts":
        return mockProfilePosts;
      case "reels":
        return mockReels;
      case "liked":
        return mockLikedPosts;
      default:
        return mockProfilePosts;
    }
  };

  const currentPosts = getTabContent();

  const handleLike = (postId: number) => {
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

  const handleSave = (postId: number) => {
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

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-blue-500 to-purple-500">
        <img
          src={userData.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        {userData.isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b">
        <div className="flex justify-between items-start -mt-16 mb-4">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
            <AvatarImage src={userData.avatar} alt={userData.displayName} />
            <AvatarFallback>
              {userData.displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mt-20 sm:mt-24">
            {userData.isOwnProfile ? (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-xl font-bold">{userData.displayName}</h1>
          <p className="text-muted-foreground">@{userData.username}</p>
        </div>

        {userData.bio && (
          <p className="text-sm mb-3 whitespace-pre-wrap">{userData.bio}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
          {userData.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{userData.location}</span>
            </div>
          )}
          {userData.website && (
            <a
              href={userData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              <span>{userData.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Joined {userData.joinDate}</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <button
            className="hover:underline"
            onClick={() => navigate(`/${userData.username}/following`)}
          >
            <span className="font-semibold text-foreground">
              {userData.following}
            </span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button
            className="hover:underline"
            onClick={() => navigate(`/${userData.username}/followers`)}
          >
            <span className="font-semibold text-foreground">
              {userData.followers}
            </span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            activeTab === "posts"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid3x3 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            activeTab === "reels"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveTab("liked")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            activeTab === "liked"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Posts */}
      <div>
        {currentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {activeTab === "posts" && "No posts yet"}
              {activeTab === "reels" && "No reels yet"}
              {activeTab === "liked" && "No liked posts yet"}
            </p>
          </div>
        ) : (
          currentPosts.map((post) => (
            <div
              key={post.id}
              className="bg-card border-b hover:bg-accent/5 transition-colors"
            >
              <div className="p-4">
                {/* Liked by indicator */}
                {activeTab === "liked" && "likedBy" in post && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Liked by {(post as LikedPost).likedBy}
                  </div>
                )}

                {/* Post Content */}
                <div className="text-sm mb-3 whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Post Image/Video */}
                {post.postImage && (
                  <div className="relative rounded-2xl overflow-hidden mb-3 border border-border">
                    <img
                      src={post.postImage}
                      alt="Post"
                      className="w-full h-auto object-cover"
                    />
                    {/* Video duration indicator */}
                    {post.type === "video" && "duration" in post && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {(post as VideoPost).duration}
                      </div>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-6">
                    <button
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                      onClick={() => handleLike(post.id)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                      <Repeat2 className="h-5 w-5" />
                      <span className="text-sm">{post.retweets}</span>
                    </button>
                    <button
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id)
                          ? "text-red-500"
                          : "hover:text-red-500"
                      }`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          likedPosts.has(post.id) ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                      <Share className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    className={`transition-colors ${
                      savedPosts.has(post.id)
                        ? "text-yellow-500"
                        : "hover:text-yellow-500"
                    }`}
                    onClick={() => handleSave(post.id)}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${
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
  );
}
