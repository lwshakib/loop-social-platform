import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageCircle,
  Heart,
  Repeat2,
  Bookmark,
  Share,
  MoreHorizontal,
  Settings,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";

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
const mockProfilePosts = [
  {
    id: 1,
    postImage: "https://picsum.photos/600/400?random=1",
    content: "Beautiful sunset today! 🌅 #sunset #nature",
    likes: 1234,
    comments: 89,
    retweets: 45,
    views: 12000,
    timeAgo: "2h",
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
  },
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [isFollowing, setIsFollowing] = useState(mockUserData.isFollowing);

  // Remove @ symbol if present in username
  const cleanUsername = username?.startsWith("@") ? username.slice(1) : username;

  // In production, fetch user data based on username
  const userData = mockUserData;

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
        <button className="flex-1 py-3 text-center font-semibold text-sm border-b-2 border-primary">
          Posts
        </button>
        <button className="flex-1 py-3 text-center font-semibold text-sm text-muted-foreground hover:text-foreground">
          Replies
        </button>
        <button className="flex-1 py-3 text-center font-semibold text-sm text-muted-foreground hover:text-foreground">
          Media
        </button>
        <button className="flex-1 py-3 text-center font-semibold text-sm text-muted-foreground hover:text-foreground">
          Likes
        </button>
      </div>

      {/* Posts */}
      <div>
        {mockProfilePosts.map((post) => (
          <div
            key={post.id}
            className="bg-card border-b hover:bg-accent/5 transition-colors"
          >
            <div className="p-4">
              {/* Post Content */}
              <div className="text-sm mb-3 whitespace-pre-wrap">
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
        ))}
      </div>
    </div>
  );
}

