import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/useAuth";
import { useUserStore } from "../../../store/userStore";

type StoryGroup = {
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  stories: {
    id: string;
    userId: string;
    user?: {
      id: string;
      firstName?: string;
      surName?: string;
      username?: string;
      profileImage?: string;
    };
    caption: string;
    url: string;
    type: "text" | "image" | "video";
    createdAt: string;
    expiresAt: string;
  }[];
};

type Post = {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName?: string;
    surName?: string;
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

const ACCESS_TOKEN_KEY = "accessToken";

const getServerUrl = (): string => {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
};

const Home = () => {
  const { userData } = useUserStore();
  const { checkAuthStatus } = useAuth();
  const navigation = useNavigation();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Scroll tracking for hiding header/tab bar
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  const isFabricEnabled = Boolean(
    typeof globalThis !== "undefined" &&
      (globalThis as { nativeFabricUIManager?: object }).nativeFabricUIManager
  );

  // Enable LayoutAnimation on Android (only when Fabric is disabled)
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      !isFabricEnabled &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, [isFabricEnabled]);

  const fetchStories = useCallback(async () => {
    try {
      setIsLoading(true);
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Fetch stories from /stories endpoint
      const response = await fetch(`${serverUrl}/stories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          // Separate own story group and others
          const ownStoryGroup = result.data.find(
            (group: StoryGroup) =>
              group.userId === userData?.id ||
              group.user?.username === userData?.username
          );
          const otherStoryGroups = result.data.filter(
            (group: StoryGroup) =>
              group.userId !== userData?.id &&
              group.user?.username !== userData?.username
          );

          // If user doesn't have a story group, create one for "Your Story"
          const finalStoryGroups: StoryGroup[] = [];
          if (ownStoryGroup) {
            finalStoryGroups.push(ownStoryGroup);
          } else if (userData) {
            // Add placeholder for "Your Story" even if no stories exist
            finalStoryGroups.push({
              userId: userData.id,
              user: {
                id: userData.id,
                firstName: userData.firstName,
                surName: userData.surName,
                username: userData.username,
                profileImage: userData.profileImage,
              },
              stories: [],
            });
          }

          // Add other story groups
          finalStoryGroups.push(...otherStoryGroups);
          setStoryGroups(finalStoryGroups);
        } else {
          // No stories, but still show "Your Story" if user exists
          if (userData) {
            setStoryGroups([
              {
                userId: userData.id,
                user: {
                  id: userData.id,
                  firstName: userData.firstName,
                  surName: userData.surName,
                  username: userData.username,
                  profileImage: userData.profileImage,
                },
                stories: [],
              },
            ]);
          } else {
            setStoryGroups([]);
          }
        }
      } else {
        // On error, still show "Your Story" if user exists
        if (userData) {
          setStoryGroups([
            {
              userId: userData.id,
              user: {
                id: userData.id,
                firstName: userData.firstName,
                surName: userData.surName,
                username: userData.username,
                profileImage: userData.profileImage,
              },
              stories: [],
            },
          ]);
        } else {
          setStoryGroups([]);
        }
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      // On error, still show "Your Story" if user exists
      if (userData) {
        setStoryGroups([
          {
            userId: userData.id,
            user: {
              id: userData.id,
              firstName: userData.firstName,
              surName: userData.surName,
              username: userData.username,
              profileImage: userData.profileImage,
            },
            stories: [],
          },
        ]);
      } else {
        setStoryGroups([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        setIsLoadingPosts(false);
        return;
      }

      const response = await fetch(`${serverUrl}/posts?limit=50`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.posts) {
          // Transform posts to ensure proper data structure
          const transformedPosts: Post[] = result.data.posts
            .filter((post: any) => post.type !== "video") // Filter out video posts
            .map((post: any) => {
              // Handle API response structure (may use _id or id)
              const postId =
                post._id?.toString() ||
                post.id?.toString() ||
                post._id ||
                post.id;

              // Extract user data - API may populate post.user from userId
              const user = post.user || {};

              // Ensure user object has all required fields with proper fallbacks
              const transformedUser = {
                id:
                  user._id?.toString() ||
                  user.id?.toString() ||
                  user._id ||
                  user.id ||
                  "",
                firstName: user.firstName || undefined,
                surName: user.surName || undefined,
                username: user.username || "unknown",
                profileImage: user.profileImage || undefined,
              };

              return {
                id: postId,
                userId: post.userId?.toString() || post.userId || "",
                user: transformedUser,
                caption: post.caption || "",
                url: post.url || undefined,
                type: post.type || "text",
                likesCount: post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                createdAt: post.createdAt || new Date().toISOString(),
                isLiked: post.isLiked || false,
                isSaved: post.isSaved || false,
              };
            });

          setPosts(transformedPosts);

          // Initialize liked and saved posts
          const likedPostIds = transformedPosts
            .filter((post: Post) => post.isLiked)
            .map((post: Post) => post.id);
          setLikedPosts(new Set(likedPostIds));

          const savedPostIds = transformedPosts
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
  }, []);

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);
    const serverUrl = getServerUrl();
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

    // Optimistic update
    const newLikedPosts = new Set(likedPosts);
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    // Update likes count
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      )
    );

    try {
      // Use DELETE method for unliking, POST for liking
      const response = await fetch(`${serverUrl}/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Like API error:", response.status, errorData);

        // Revert on error
        setLikedPosts(likedPosts);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likesCount: isLiked
                    ? post.likesCount + 1
                    : post.likesCount - 1,
                }
              : post
          )
        );

        Alert.alert(
          "Error",
          errorData.message || `Failed to ${isLiked ? "unlike" : "like"} post`
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert on error
      setLikedPosts(likedPosts);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
              }
            : post
        )
      );
    }
  };

  const handleSave = async (postId: string) => {
    const isSaved = savedPosts.has(postId);
    const serverUrl = getServerUrl();
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to save posts");
      return;
    }

    // Optimistic update
    const newSavedPosts = new Set(savedPosts);
    if (isSaved) {
      newSavedPosts.delete(postId);
    } else {
      newSavedPosts.add(postId);
    }
    setSavedPosts(newSavedPosts);

    try {
      // Use DELETE method for unsaving, POST for saving
      const response = await fetch(`${serverUrl}/posts/${postId}/saved`, {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save API error:", response.status, errorData);

        // Revert on error
        setSavedPosts(savedPosts);

        Alert.alert(
          "Error",
          errorData.message || `Failed to ${isSaved ? "unsave" : "save"} post`
        );
      }
    } catch (error) {
      console.error("Error saving post:", error);
      // Revert on error
      setSavedPosts(savedPosts);
    }
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

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Ensure access token is valid or refreshed using saved refresh token
      await checkAuthStatus();
      await Promise.all([fetchStories(), fetchPosts()]);
    } catch (error) {
      console.error("Error refreshing feed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [checkAuthStatus, fetchStories, fetchPosts]);

  useEffect(() => {
    if (userData) {
      fetchStories();
      fetchPosts();
    }
  }, [userData, fetchStories, fetchPosts]);

  const getStoryAvatarUrl = (storyGroup: StoryGroup) => {
    if (storyGroup.user?.profileImage) return storyGroup.user.profileImage;
    if (storyGroup.user?.username) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${storyGroup.user.username}`;
    }
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
  };

  const renderStory = (storyGroup: StoryGroup, index: number) => {
    if (!storyGroup.user) return null;

    const avatarUrl = getStoryAvatarUrl(storyGroup);
    const isOwnStory =
      storyGroup.userId === userData?.id ||
      storyGroup.user?.username === userData?.username;
    const displayName = isOwnStory
      ? "Your Story"
      : storyGroup.user.username && storyGroup.user.username.length > 10
        ? storyGroup.user.username.substring(0, 10) + "..."
        : storyGroup.user.username || "Unknown";
    const hasUnviewed =
      storyGroup.stories && storyGroup.stories.length > 0 && !isOwnStory;
    const hasStories = storyGroup.stories && storyGroup.stories.length > 0;
    const firstStory = hasStories ? storyGroup.stories[0] : null;

    return (
      <TouchableOpacity
        key={storyGroup.userId || index}
        className="items-center mr-4"
        onPress={() => {
          // Handle story press - navigate to story viewer
          if (isOwnStory) {
            // Handle create/view own story
          } else if (firstStory) {
            // Navigate to story viewer
          }
        }}
      >
        <View className="relative">
          {/* Gradient border effect for unviewed stories */}
          {hasUnviewed ? (
            <View
              className="rounded-full"
              style={{
                width: 76,
                height: 76,
                padding: 2.5,
                backgroundColor: "#E91E63", // Outer gradient color
              }}
            >
              <View
                className="rounded-full"
                style={{
                  width: "100%",
                  height: "100%",
                  padding: 1.5,
                  backgroundColor: "#F06292", // Middle gradient color
                }}
              >
                <View
                  className="rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800"
                  style={{ width: "100%", height: "100%" }}
                >
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View
              className="rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600"
              style={{
                width: 72,
                height: 72,
                padding: 2,
              }}
            >
              <View
                className="rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800"
                style={{ width: "100%", height: "100%" }}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
            </View>
          )}
          {isOwnStory && (
            <View
              className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-white dark:border-black"
              style={{ width: 24, height: 24 }}
            >
              <View className="flex-1 items-center justify-center">
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </View>
            </View>
          )}
        </View>
        <Text
          className="text-xs mt-1.5 text-black dark:text-white"
          numberOfLines={1}
          style={{ maxWidth: 76 }}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={[]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (event: any) => {
              const currentScrollY = event.nativeEvent.contentOffset.y;
              const delta = currentScrollY - lastScrollY.current;

              // Only trigger if scroll delta is significant (prevents bounce/deceleration triggers)
              const SCROLL_THRESHOLD = 5;

              if (delta > SCROLL_THRESHOLD && currentScrollY > 50) {
                // Scrolling down significantly
                if (!isScrollingDown) {
                  // Smooth animation using easeInEaseOut (kept for potential other UI changes)
                  LayoutAnimation.configureNext({
                    duration: 200,
                    create: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                      property: LayoutAnimation.Properties.opacity,
                    },
                    update: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                    },
                    delete: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                      property: LayoutAnimation.Properties.opacity,
                    },
                  });
                  setIsScrollingDown(true);
                  // Header remains visible; no navigation.setOptions call
                }
              } else if (delta < -SCROLL_THRESHOLD) {
                // Scrolling up significantly
                if (isScrollingDown) {
                  // Smooth animation using easeInEaseOut
                  LayoutAnimation.configureNext({
                    duration: 200,
                    create: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                      property: LayoutAnimation.Properties.opacity,
                    },
                    update: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                    },
                    delete: {
                      type: LayoutAnimation.Types.easeInEaseOut,
                      property: LayoutAnimation.Properties.opacity,
                    },
                  });
                  setIsScrollingDown(false);
                  // Header remains visible; no navigation.setOptions call
                }
              }

              lastScrollY.current = currentScrollY;
            },
          }
        )}
        scrollEventThrottle={16}
      >
        {/* Stories Section */}
        <View className="py-3 border-b border-gray-200 dark:border-gray-800">
          {isLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              {storyGroups.length > 0 ? (
                storyGroups.map((storyGroup, index) =>
                  renderStory(storyGroup, index)
                )
              ) : (
                <Text className="text-sm text-gray-500 dark:text-gray-400 px-4">
                  No stories available
                </Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* Posts Feed */}
        {isLoadingPosts ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : posts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-base text-gray-500 dark:text-gray-400">
              No posts yet
            </Text>
          </View>
        ) : (
          <View>
            {posts.map((post) => {
              // Ensure we always have a valid avatar URL
              const avatarUrl =
                post.user.profileImage && post.user.profileImage.trim() !== ""
                  ? post.user.profileImage
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username || "user"}`;
              const isLiked = likedPosts.has(post.id);
              const isSaved = savedPosts.has(post.id);
              const displayName =
                post.user.firstName && post.user.surName
                  ? `${post.user.firstName} ${post.user.surName}`
                  : post.user.username || "Unknown User";

              // Format numbers (8.7K, 1.3M, etc.)
              const formatCount = (count: number): string => {
                if (count >= 1000000) {
                  return `${(count / 1000000).toFixed(1)}M`;
                }
                if (count >= 1000) {
                  return `${(count / 1000).toFixed(1)}K`;
                }
                return count.toString();
              };

              return (
                <TouchableOpacity
                  key={post.id}
                  className="border-b border-gray-200 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-900"
                  activeOpacity={0.7}
                >
                  <View className="flex-row px-4 pt-3 pb-2">
                    {/* Profile Picture */}
                    <TouchableOpacity
                      onPress={() => {
                        // Navigate to profile
                      }}
                      className="mr-3"
                    >
                      <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                        <Image
                          source={{ uri: avatarUrl }}
                          style={{ width: 48, height: 48 }}
                          contentFit="cover"
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Post Header - Name, Handle, Time */}
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <TouchableOpacity
                          onPress={() => {
                            // Navigate to profile
                          }}
                          className="flex-row items-center"
                        >
                          <Text className="text-base font-semibold text-black dark:text-white">
                            {displayName}
                          </Text>
                          {/* Verified checkmark if needed */}
                          {(post.user as any).isVerified && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#007AFF"
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </TouchableOpacity>
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

                    {/* Three dots menu */}
                    <TouchableOpacity className="ml-2">
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Post Content */}
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
                          style={{ width: "100%", aspectRatio: 1 }}
                          contentFit="cover"
                        />
                      </View>
                    )}
                  </View>

                  {/* Post Actions */}
                  <View
                    className="flex-row items-center justify-between px-4 pb-3"
                    style={{ paddingLeft: 64 }}
                  >
                    {/* Comments */}
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => {
                        // Handle comment
                      }}
                    >
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

                    {/* Reposts */}
                    <TouchableOpacity className="flex-row items-center">
                      <Ionicons
                        name="repeat-outline"
                        size={20}
                        color="#8E8E93"
                      />
                      {((post as any).repostsCount || 0) > 0 && (
                        <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          {formatCount((post as any).repostsCount)}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Likes */}
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

                    {/* Views */}
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

                    {/* Bookmark */}
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

                    {/* Share */}
                    <TouchableOpacity className="ml-2">
                      <Ionicons
                        name="share-outline"
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
