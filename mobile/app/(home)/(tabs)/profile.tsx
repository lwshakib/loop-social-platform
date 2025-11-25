import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../../store/userStore";

type TabType = "posts" | "reels" | "liked" | "saved";

type Post = {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    surName: string;
    username: string;
    profileImage?: string;
  };
  caption: string;
  url?: string;
  type: "text" | "image" | "video";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type UserData = {
  id: string;
  firstName: string;
  surName: string;
  username: string;
  email: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  profileImage?: string;
  coverImage?: string;
  isVerified?: boolean;
  createdAt: string;
  postsCount: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
};

const ACCESS_TOKEN_KEY = "accessToken";

// Helper function to format date
const formatDate = (date: string): string => {
  const d = new Date(date);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Helper to get server URL
const getServerUrl = (): string => {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const buildDicebearAvatar = (seed?: string): string => {
  const safeSeed = encodeURIComponent(seed?.trim() || "user");
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${safeSeed}`;
};

const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path || path.trim() === "") {
    return null;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    return null;
  }
  const normalizedServer = serverUrl.endsWith("/")
    ? serverUrl.slice(0, -1)
    : serverUrl;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedServer}/${normalizedPath}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.userData);
  const { setUserData: setStoreUserData } = useUserStore();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const iconColor = isDarkMode ? "#FFFFFF" : "#000000";

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    surName: "",
    username: "",
    bio: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [imageAspectRatios, setImageAspectRatios] = useState<
    Record<string, number>
  >({});
  const [isFollowing] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const reelItemSize = (screenWidth - 6) / 3;

  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.username === userData?.username;

  // Fetch user data (current user's profile)
  const fetchUserData = useCallback(async () => {
    if (!currentUser?.username) return;

    try {
      setIsLoading(true);
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${serverUrl}/users/${currentUser.username}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setUserData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.username]);

  // Fetch posts based on active tab
  const fetchPosts = useCallback(async () => {
    if (!currentUser?.username) return;

    try {
      setIsLoadingPosts(true);
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      const type =
        activeTab === "reels"
          ? "reels"
          : activeTab === "liked"
            ? "liked"
            : activeTab === "saved"
              ? "saved"
              : "posts";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${serverUrl}/users/${currentUser.username}/posts?type=${type}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data?.posts) {
          setPosts(result.data.posts);
          // Initialize likedPosts and savedPosts
          const likedPostIds = result.data.posts
            .filter((post: Post) => post.isLiked)
            .map((post: Post) => post.id);
          setLikedPosts(new Set(likedPostIds));
          const savedPostIds = result.data.posts
            .filter((post: Post) => post.isSaved)
            .map((post: Post) => post.id);
          setSavedPosts(new Set(savedPostIds));
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [currentUser?.username, activeTab]);

  useEffect(() => {
    posts.forEach((post) => {
      if (post.type === "image" && post.url && !imageAspectRatios[post.id]) {
        RNImage.getSize(
          post.url,
          (width, height) => {
            if (width > 0 && height > 0) {
              setImageAspectRatios((prev) => {
                if (prev[post.id]) return prev;
                return { ...prev, [post.id]: width / height };
              });
            }
          },
          () => {
            setImageAspectRatios((prev) => {
              if (prev[post.id]) return prev;
              return { ...prev, [post.id]: 1 };
            });
          }
        );
      }
    });
  }, [posts, imageAspectRatios]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleEditProfileClick = () => {
    if (userData) {
      setEditFormData({
        firstName: userData.firstName,
        surName: userData.surName,
        username: userData.username,
        bio: userData.bio || "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUploading(true);
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        Alert.alert("Error", "You must be logged in to update your profile");
        return;
      }

      const response = await fetch(`${serverUrl}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          // Update user store
          setStoreUserData(result.data);
          // Refresh profile data
          await fetchUserData();
          Alert.alert("Success", "Profile updated successfully");
          setIsEditModalOpen(false);
        }
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

    const isLiked = likedPosts.has(postId);
    const serverUrl = getServerUrl();

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
            ? { ...post, likesCount: Math.max(0, post.likesCount - 1) }
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
            ? { ...post, likesCount: post.likesCount + 1 }
            : post
        )
      );
    }

    try {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`${serverUrl}/posts/${postId}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to like post");
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
    }
  };

  const handleSave = async (postId: string) => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to save posts");
      return;
    }

    const isSaved = savedPosts.has(postId);
    const serverUrl = getServerUrl();

    // Optimistic update
    if (isSaved) {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
    }

    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await fetch(`${serverUrl}/posts/${postId}/saved`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
    }
  };

  const renderEmptyMessage = () => {
    switch (activeTab) {
      case "reels":
        return "No reels yet";
      case "liked":
        return "No liked posts yet";
      case "saved":
        return "No saved posts yet";
      default:
        return "No posts yet";
    }
  };

  const renderReelTile = ({ item }: { item: Post }) => (
    <TouchableOpacity
      className="bg-black rounded-xl overflow-hidden m-0.5"
      style={{ width: reelItemSize, height: reelItemSize }}
      activeOpacity={0.85}
      onPress={() => router.push(`/reel/${item.id}` as const)}
    >
      {item.url ? (
        <Image
          source={{ uri: item.url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-900">
          <Ionicons name="play" size={28} color="#FFFFFF" />
        </View>
      )}
      <View className="absolute inset-0 bg-black/20" />
      <View className="absolute bottom-1 left-1 flex-row items-center">
        <Ionicons name="play" size={12} color="#FFFFFF" />
        <Text className="text-white text-xs font-semibold ml-1">
          {formatCount((item as any).viewsCount || item.likesCount || 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPostsContent = () => {
    if (isLoadingPosts) {
      return (
        <View className="py-12 items-center bg-white dark:bg-black">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-3 text-base text-gray-500 dark:text-gray-400">
            Loading posts...
          </Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View className="py-12 items-center bg-white dark:bg-black">
          <Text className="text-base text-gray-500 dark:text-gray-400">
            {renderEmptyMessage()}
          </Text>
        </View>
      );
    }

    if (activeTab === "reels") {
      return (
        <FlatList
          data={posts}
          renderItem={renderReelTile}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={{ padding: 1 }}
        />
      );
    }

    return (
      <View>
        {posts.map((post) => {
          const avatarUrl =
            resolveMediaUrl(post.user.profileImage) ||
            buildDicebearAvatar(post.user.username);
          const isLiked = likedPosts.has(post.id);
          const isSaved = savedPosts.has(post.id);
          const displayName =
            post.user.firstName && post.user.surName
              ? `${post.user.firstName} ${post.user.surName}`
              : post.user.username || "Unknown User";

          return (
            <View
              key={post.id}
              className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
            >
              <View className="flex-row px-4 pt-3 pb-2">
                <View className="mr-3">
                  <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{ width: 48, height: 48 }}
                      contentFit="cover"
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-base font-semibold text-black dark:text-white">
                      {displayName}
                    </Text>
                    {(post.user as any).isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#007AFF"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                    <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      @{post.user.username}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mx-1">
                      ·
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(post.createdAt)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity className="ml-2">
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>

              <View className="px-4 pb-2" style={{ paddingLeft: 64 }}>
                {post.caption && (
                  <Text className="text-base text-black dark:text-white leading-6 mb-2">
                    {post.caption}
                  </Text>
                )}
                {post.url && post.type === "image" && (
                  <View className="rounded-2xl overflow-hidden my-2">
                    <Image
                      source={{ uri: post.url }}
                      style={{
                        width: "100%",
                        aspectRatio: imageAspectRatios[post.id] || 1,
                      }}
                      contentFit="contain"
                    />
                  </View>
                )}
              </View>

              <View
                className="flex-row items-center justify-between px-4 pb-3"
                style={{ paddingLeft: 64 }}
              >
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color="#8E8E93"
                  />
                  {post.commentsCount > 0 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {formatCount(post.commentsCount)}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="repeat-outline" size={20} color="#8E8E93" />
                  {((post as any).repostsCount || 0) > 0 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {formatCount((post as any).repostsCount)}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleLike(post.id)}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={isLiked ? "#E91E63" : "#8E8E93"}
                  />
                  {post.likesCount > 0 && (
                    <Text
                      className={`text-sm ml-2 ${
                        isLiked
                          ? "text-pink-600 dark:text-pink-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatCount(post.likesCount)}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color="#8E8E93"
                  />
                  {((post as any).viewsCount || 0) > 0 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {formatCount((post as any).viewsCount)}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSave(post.id)}
                  className="ml-2"
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color={isSaved ? "#007AFF" : "#8E8E93"}
                  />
                </TouchableOpacity>

                <TouchableOpacity className="ml-2">
                  <Ionicons name="share-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={[]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-3 text-base text-gray-500 dark:text-gray-400">
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={[]}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-gray-500 dark:text-gray-400">
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = `${userData.firstName} ${userData.surName}`;
  const avatarUrl =
    resolveMediaUrl(userData.profileImage) ||
    buildDicebearAvatar(userData.username);
  const coverImageUrl =
    resolveMediaUrl(userData.coverImage) ||
    "https://picsum.photos/800/300?random=profile";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={[]}>
      <ScrollView
        className="flex-1 bg-white dark:bg-black"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View className="w-full h-[200px] bg-gray-200 dark:bg-gray-900">
          <Image
            source={{ uri: coverImageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>

        {/* Profile Info */}
        <View className="px-4 pb-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <View className="flex-row justify-between items-end -mt-[60px] mb-4">
            <View className="w-[120px] h-[120px] rounded-full border-4 border-white dark:border-black overflow-hidden bg-gray-200 dark:bg-gray-800">
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            <View className="flex-row gap-2 items-center">
              {isOwnProfile ? (
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-500"
                  onPress={handleEditProfileClick}
                >
                  <Ionicons name="create-outline" size={18} color="#007AFF" />
                  <Text className="text-sm font-semibold text-blue-500">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${isFollowing ? "bg-transparent border border-gray-200 dark:border-gray-700" : "bg-blue-500"}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${isFollowing ? "text-black dark:text-white" : "text-white"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-2xl font-bold text-black dark:text-white mb-1">
              {displayName}
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-2">
              @{userData.username}
            </Text>
            {userData.bio && (
              <Text className="text-sm text-black dark:text-white mb-2 leading-5">
                {userData.bio}
              </Text>
            )}
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Joined {formatDate(userData.createdAt)}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-6">
            <TouchableOpacity className="items-start">
              <Text className="text-lg font-semibold text-black dark:text-white mb-0.5">
                {userData.following.toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-start">
              <Text className="text-lg font-semibold text-black dark:text-white mb-0.5">
                {userData.followers.toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-start"
              onPress={() => setActiveTab("posts")}
            >
              <Text className="text-lg font-semibold text-black dark:text-white mb-0.5">
                {userData.postsCount.toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Posts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-3 border-b-2 ${activeTab === "posts" ? "border-blue-500" : "border-transparent"}`}
            onPress={() => setActiveTab("posts")}
          >
            <Ionicons
              name="grid"
              size={20}
              color={activeTab === "posts" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-3 border-b-2 ${activeTab === "reels" ? "border-blue-500" : "border-transparent"}`}
            onPress={() => setActiveTab("reels")}
          >
            <Ionicons
              name="play-circle"
              size={20}
              color={activeTab === "reels" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-3 border-b-2 ${activeTab === "liked" ? "border-blue-500" : "border-transparent"}`}
            onPress={() => setActiveTab("liked")}
          >
            <Ionicons
              name="heart"
              size={20}
              color={activeTab === "liked" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-3 border-b-2 ${activeTab === "saved" ? "border-blue-500" : "border-transparent"}`}
            onPress={() => setActiveTab("saved")}
          >
            <Ionicons
              name="bookmark"
              size={20}
              color={activeTab === "saved" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        {renderPostsContent()}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
              <Text className="text-base text-gray-500 dark:text-gray-400">
                Cancel
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-black dark:text-white">
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={isUploading}
            >
              <Text
                className={`text-base font-semibold ${isUploading ? "opacity-50 text-blue-500" : "text-blue-500"}`}
              >
                {isUploading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4 bg-white dark:bg-black">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">
                First Name
              </Text>
              <TextInput
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base text-black dark:text-white bg-white dark:bg-gray-800"
                value={editFormData.firstName}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="First name"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">
                Surname
              </Text>
              <TextInput
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base text-black dark:text-white bg-white dark:bg-gray-800"
                value={editFormData.surName}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, surName: text }))
                }
                placeholder="Surname"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">
                Username
              </Text>
              <TextInput
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base text-black dark:text-white bg-white dark:bg-gray-800"
                value={editFormData.username}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, username: text }))
                }
                placeholder="Username"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">
                Bio
              </Text>
              <TextInput
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base text-black dark:text-white bg-white dark:bg-gray-800 h-[100px]"
                value={editFormData.bio}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, bio: text }))
                }
                placeholder="Tell us about yourself"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                maxLength={160}
                textAlignVertical="top"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {editFormData.bio.length}/160
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
