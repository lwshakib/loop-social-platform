import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.userData);
  const { setUserData: setStoreUserData, getAvatarUrl } = useUserStore();

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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);

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
          post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post
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

  const renderPostItem = ({ item }: { item: Post }) => {
    const screenWidth = Dimensions.get("window").width;
    const itemSize = (screenWidth - 2) / 3;

    return (
      <TouchableOpacity
        className="m-0.5 bg-gray-200 dark:bg-gray-800 overflow-hidden"
        style={{ width: itemSize, height: itemSize }}
        onPress={() => {
          setSelectedPost(item);
          setIsPostModalOpen(true);
        }}
      >
        {item.url ? (
          item.type === "video" ? (
            <View className="w-full h-full relative">
              <Image
                source={{ uri: item.url }}
                className="w-full h-full"
                contentFit="cover"
              />
              <View className="absolute inset-0 justify-center items-center bg-black/20">
                <Ionicons name="play" size={20} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: item.url }}
              className="w-full h-full"
              contentFit="cover"
            />
          )
        ) : (
          <View className="w-full h-full justify-center items-center p-2">
            <Text className="text-xs text-black dark:text-white text-center" numberOfLines={3}>
              {item.caption || "Post"}
            </Text>
          </View>
        )}
        {item.type === "video" && (
          <View className="absolute top-2 right-2">
            <Ionicons name="play-circle" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-3 text-base text-gray-500 dark:text-gray-400">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-gray-500 dark:text-gray-400">User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = `${userData.firstName} ${userData.surName}`;
  const avatarUrl = userData.profileImage || getAvatarUrl();
  const coverImageUrl =
    userData.coverImage || "https://picsum.photos/800/300?random=profile";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View className="w-full h-[200px] bg-gray-200 dark:bg-gray-800">
          <Image
            source={{ uri: coverImageUrl }}
            className="w-full h-full"
            contentFit="cover"
          />
        </View>

        {/* Profile Info */}
        <View className="px-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <View className="flex-row justify-between items-end -mt-[60px] mb-4">
            <View className="w-[120px] h-[120px] rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200 dark:bg-gray-800">
              <Image
                source={{ uri: avatarUrl }}
                className="w-full h-full"
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
                  <Text className="text-sm font-semibold text-blue-500">Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Ionicons name="chatbubble-outline" size={18} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${isFollowing ? "bg-transparent border border-gray-200 dark:border-gray-700" : "bg-blue-500"}`}
                  >
                    <Text className={`text-sm font-semibold ${isFollowing ? "text-black dark:text-white" : "text-white"}`}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Ionicons name="ellipsis-horizontal" size={18} color="#000000" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-2xl font-bold text-black dark:text-white mb-1">{displayName}</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-2">@{userData.username}</Text>
            {userData.bio && <Text className="text-sm text-black dark:text-white mb-2 leading-5">{userData.bio}</Text>}
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
              <Text className="text-sm text-gray-500 dark:text-gray-400">Following</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-start">
              <Text className="text-lg font-semibold text-black dark:text-white mb-0.5">
                {userData.followers.toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-start"
              onPress={() => setActiveTab("posts")}
            >
              <Text className="text-lg font-semibold text-black dark:text-white mb-0.5">
                {userData.postsCount.toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">Posts</Text>
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
        {isLoadingPosts ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text className="mt-3 text-base text-gray-500 dark:text-gray-400">Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="py-12 items-center">
            <Text className="text-base text-gray-500 dark:text-gray-400">
              {activeTab === "posts" && "No posts yet"}
              {activeTab === "reels" && "No reels yet"}
              {activeTab === "liked" && "No liked posts yet"}
              {activeTab === "saved" && "No saved posts yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={{ padding: 0.5 }}
          />
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
              <Text className="text-base text-gray-500 dark:text-gray-400">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-black dark:text-white">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={isUploading}
            >
              <Text className={`text-base font-semibold ${isUploading ? "opacity-50 text-blue-500" : "text-blue-500"}`}>
                {isUploading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">First Name</Text>
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
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">Surname</Text>
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
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">Username</Text>
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
              <Text className="text-sm font-semibold text-black dark:text-white mb-2">Bio</Text>
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

      {/* Post Detail Modal */}
      <Modal
        visible={isPostModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPostModalOpen(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <Pressable
            className="absolute inset-0"
            onPress={() => setIsPostModalOpen(false)}
          />
          {selectedPost && (
            <View className="w-[90%] max-h-[80%] bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
              <TouchableOpacity
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 justify-center items-center"
                onPress={() => setIsPostModalOpen(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {selectedPost.url && (
                <Image
                  source={{ uri: selectedPost.url }}
                  className="w-full h-[400px] bg-black"
                  contentFit="contain"
                />
              )}
              <View className="flex-row p-4 gap-4 border-b border-gray-200 dark:border-gray-800">
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={() => handleLike(selectedPost.id)}
                >
                  <Ionicons
                    name={likedPosts.has(selectedPost.id) ? "heart" : "heart-outline"}
                    size={24}
                    color={likedPosts.has(selectedPost.id) ? "#EF4444" : "#000000"}
                  />
                  <Text className="text-base font-semibold text-black dark:text-white">
                    {selectedPost.likesCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-2">
                  <Ionicons name="chatbubble-outline" size={24} color="#000000" />
                  <Text className="text-base font-semibold text-black dark:text-white">
                    {selectedPost.commentsCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={() => handleSave(selectedPost.id)}
                >
                  <Ionicons
                    name={savedPosts.has(selectedPost.id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color={savedPosts.has(selectedPost.id) ? "#FBBF24" : "#000000"}
                  />
                </TouchableOpacity>
              </View>
              {selectedPost.caption && (
                <View className="p-4">
                  <Text className="text-sm text-black dark:text-white leading-5">
                    {selectedPost.caption}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

