import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { VideoView, useVideoPlayer } from "expo-video";
import { useUserStore } from "../../../store/userStore";

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
    expiresAt: string;
  }>;
};

type Comment = {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    surName: string;
    username: string;
    profileImage?: string;
  };
  comment: string;
  createdAt: string;
  replies?: Comment[];
  replyCount?: number;
};

const ACCESS_TOKEN_KEY = "accessToken";

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

// Helper to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    const value = num / 1000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
  }
  return num.toLocaleString();
};

// Helper to get server URL
const getServerUrl = (): string => {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
};

// Video Player Component
const VideoPlayer = ({
  videoUrl,
  isMuted,
  shouldPlay,
}: {
  videoUrl: string;
  isMuted: boolean;
  shouldPlay: boolean;
}) => {
  const player = useVideoPlayer({ uri: videoUrl }, (player) => {
    player.loop = true;
    player.muted = isMuted;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  return <VideoView player={player} className="w-full h-full" contentFit="cover" />;
};

export default function HomeScreen() {
  const router = useRouter();
  const { userData, getAvatarUrl, getAvatarFallback } = useUserStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const storiesScrollRef = useRef<ScrollView>(null);

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        setIsLoadingStories(false);
        return;
      }

      const response = await fetch(`${serverUrl}/stories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
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
          const transformedPosts: Post[] = result.data.posts.map((post: any) => {
            const user = post.user || {};
            let displayName = "Unknown User";
            if (user.firstName && user.surName) {
              displayName = `${user.firstName} ${user.surName}`;
            } else if (user.firstName) {
              displayName = user.firstName;
            } else if (user.username) {
              displayName = user.username;
            }

            const username = user.username && user.username.trim()
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
              timeAgo: formatTimeAgo(post.createdAt),
              createdAt: post.createdAt,
              isLiked: post.isLiked || false,
              isSaved: post.isSaved || false,
            };
          });

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
  }, []);

  useEffect(() => {
    fetchStories();
    fetchPosts();
  }, [fetchStories, fetchPosts]);

  // Handle like
  const handleLike = async (postId: string) => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

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
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes: previousLikesCount, isLiked: !isLiked }
              : post
          )
        );
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
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: previousLikesCount, isLiked: !isLiked }
            : post
        )
      );
    }
  };

  // Handle save
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
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isSaved: !isSaved } : post
          )
        );
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to save post");
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
          post.id === postId ? { ...post, isSaved: !isSaved } : post
        )
      );
    }
  };

  // Fetch comments
  useEffect(() => {
    if (!selectedPost?.id || !isCommentsModalOpen) return;

    const fetchComments = async () => {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return;
      }

      try {
        setIsLoadingComments(true);
        const serverUrl = getServerUrl();
        const response = await fetch(
          `${serverUrl}/posts/${selectedPost.id}/comments`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data?.comments) {
            setComments(result.data.comments);
            setReplyingTo(null);
            setReplyText({});
          }
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [selectedPost?.id, isCommentsModalOpen]);

  // Handle submit comment
  const handleSubmitComment = async (parentId?: string) => {
    const commentText = parentId
      ? replyText[parentId]?.trim()
      : newComment.trim();

    if (!commentText || !selectedPost?.id) {
      return;
    }

    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    try {
      setIsSubmittingComment(true);
      const serverUrl = getServerUrl();
      const response = await fetch(
        `${serverUrl}/posts/${selectedPost.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            comment: commentText,
            parentId: parentId || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data?.comment) {
          if (parentId) {
            setComments((prev) =>
              prev.map((comment) => {
                if (comment.id === parentId) {
                  const existingReplies = comment.replies || [];
                  return {
                    ...comment,
                    replies: [...existingReplies, result.data.comment],
                    replyCount: (comment.replyCount || 0) + 1,
                  };
                }
                return comment;
              })
            );
            setReplyText((prev) => {
              const newReplyText = { ...prev };
              delete newReplyText[parentId];
              return newReplyText;
            });
            setReplyingTo(null);
          } else {
            setComments((prev) => [result.data.comment, ...prev]);
            setNewComment("");
          }
          // Update post comments count
          setPosts((prev) =>
            prev.map((post) =>
              post.id === selectedPost.id
                ? { ...post, comments: post.comments + 1 }
                : post
            )
          );
        }
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Render story item
  const renderStoryItem = (storyGroup: StoryGroup, index: number) => {
    if (!storyGroup.user || !storyGroup.stories || storyGroup.stories.length === 0) {
      return null;
    }

    const firstStory = storyGroup.stories[0];
    const isCurrentUser = userData?.id === storyGroup.userId;

    return (
      <TouchableOpacity
        key={storyGroup.userId}
        className="items-center w-[70px]"
        onPress={() => {
          if (storyGroup.user?.username && firstStory?.id) {
            router.push(`/stories/@${storyGroup.user.username}/${firstStory.id}`);
          }
        }}
      >
        <View className="w-[70px] h-[70px] rounded-full border-2 border-gray-200 dark:border-gray-700 p-0.5 mb-1">
          <Image
            source={{ uri: storyGroup.user.profileImage || getAvatarUrl() }}
            className="w-full h-full rounded-[32px]"
            contentFit="cover"
          />
        </View>
        <Text className="text-xs text-black dark:text-white text-center max-w-[70px]" numberOfLines={1}>
          {isCurrentUser ? "Your story" : `@${storyGroup.user.username || "unknown"}`}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render post item
  const renderPostItem = ({ item }: { item: Post }) => {
    const isLiked = likedPosts.has(item.id);
    const isSaved = savedPosts.has(item.id);
    const isVideoPlaying = playingVideoId === item.id;

    return (
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3 px-4">
        {/* Post Header */}
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => router.push(`/(home)/(tabs)/profile`)}
            className="flex-row items-center flex-1"
          >
            <Image
              source={{ uri: item.userAvatar || getAvatarUrl() }}
              className="w-10 h-10 rounded-full mr-3"
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black dark:text-white">{item.displayName}</Text>
              <Text className="text-[15px] text-gray-500 dark:text-gray-400">@{item.username}</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-[15px] text-gray-500 dark:text-gray-400">{item.timeAgo}</Text>
        </View>

        {/* Post Content */}
        {item.content ? (
          <Text className="text-[15px] text-black dark:text-white leading-5 mb-3">{item.content}</Text>
        ) : null}

        {/* Post Image or Video */}
        {item.postImage && (
          <Image
            source={{ uri: item.postImage }}
            className="w-full aspect-square rounded-lg mb-3"
            contentFit="cover"
          />
        )}
        {item.postVideo && (
          <View className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-black">
            <VideoPlayer
              videoUrl={item.postVideo}
              isMuted={true}
              shouldPlay={isVideoPlaying}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center gap-6 mt-2">
          <TouchableOpacity
            className="flex-row items-center gap-1.5"
            onPress={() => {
              setSelectedPost(item);
              setIsCommentsModalOpen(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
            <Text className="text-sm text-black dark:text-white">{formatNumber(item.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-1.5"
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#EF4444" : "#000"}
            />
            <Text className={`text-sm ${isLiked ? "text-red-500" : "text-black dark:text-white"}`}>
              {formatNumber(item.likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-1.5"
            onPress={() => handleSave(item.id)}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? "#FBBF24" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* Stories Section */}
            <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3">
              <ScrollView
                ref={storiesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}
              >
                {/* Create Story - Current User */}
                {userData && (
                  <TouchableOpacity
                    className="items-center w-[70px]"
                    onPress={() => {
                      // TODO: Open create story dialog
                      Alert.alert("Coming Soon", "Story creation coming soon!");
                    }}
                  >
                    <View className="w-[70px] h-[70px] rounded-full border-2 border-blue-500 p-0.5 mb-1">
                      <Image
                        source={{ uri: getAvatarUrl() }}
                        className="w-full h-full rounded-[32px]"
                        contentFit="cover"
                      />
                      <View className="absolute bottom-0 right-0 w-6 h-6 rounded-xl bg-blue-500 border-2 border-white items-center justify-center">
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text className="text-xs text-black dark:text-white text-center max-w-[70px]" numberOfLines={1}>
                      Your story
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Other Stories */}
                {isLoadingStories ? (
                  <View className="items-center w-[70px]">
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : (
                  stories.map((storyGroup, index) =>
                    renderStoryItem(storyGroup, index)
                  )
                )}
              </ScrollView>
            </View>

            {/* Loading Posts */}
            {isLoadingPosts && (
              <View className="p-8 items-center justify-center">
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {/* Empty State */}
            {!isLoadingPosts && posts.length === 0 && (
              <View className="p-8 items-center justify-center">
                <Text className="text-sm text-gray-500 dark:text-gray-400">No posts available</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={null}
        contentContainerStyle={{ paddingBottom: 16 }}
        onViewableItemsChanged={({ viewableItems }) => {
          const visibleVideo = viewableItems.find(
            (item) => item.item.postVideo
          );
          setPlayingVideoId(visibleVideo?.item.id || null);
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* Comments Modal */}
      <Modal
        visible={isCommentsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCommentsModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Text className="text-lg font-semibold text-black dark:text-white">Comments</Text>
            <TouchableOpacity
              onPress={() => setIsCommentsModalOpen(false)}
              className="p-1"
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {isLoadingComments ? (
            <View className="p-8 items-center justify-center">
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <Image
                    source={{
                      uri: item.user.profileImage || getAvatarUrl(),
                    }}
                    className="w-8 h-8 rounded-2xl mr-3"
                    contentFit="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-sm font-semibold text-black dark:text-white">
                        {item.user.firstName} {item.user.surName}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-sm text-black dark:text-white leading-5 mb-1">{item.comment}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setReplyingTo(replyingTo === item.id ? null : item.id);
                      }}
                    >
                      <Text className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        {replyingTo === item.id ? "Cancel" : "Reply"}
                      </Text>
                    </TouchableOpacity>
                    {replyingTo === item.id && (
                      <View className="flex-row items-center gap-2 mt-2 pl-2">
                        <TextInput
                          className="flex-1 text-sm text-black dark:text-white py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-[20px] max-h-[100px]"
                          placeholder="Write a reply..."
                          placeholderTextColor="#8E8E93"
                          value={replyText[item.id] || ""}
                          onChangeText={(text) =>
                            setReplyText({ ...replyText, [item.id]: text })
                          }
                          multiline
                        />
          <TouchableOpacity
                          onPress={() => handleSubmitComment(item.id)}
                          disabled={isSubmittingComment}
                        >
                          <Ionicons
                            name="send"
                            size={20}
                            color={
                              replyText[item.id]?.trim()
                                ? "#007AFF"
                                : "#8E8E93"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                    {item.replies && item.replies.length > 0 && (
                      <View className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                        {item.replies.map((reply) => (
                          <View key={reply.id} className="flex-row mt-2">
                            <Image
                              source={{
                                uri: reply.user.profileImage || getAvatarUrl(),
                              }}
                              className="w-6 h-6 rounded-xl mr-2"
                              contentFit="cover"
                            />
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-sm font-semibold text-black dark:text-white">
                                  {reply.user.firstName} {reply.user.surName}
                                </Text>
                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(reply.createdAt)}
                                </Text>
                              </View>
                              <Text className="text-sm text-black dark:text-white leading-5">
                                {reply.comment}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center justify-center">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">No comments yet</Text>
                </View>
              }
            />
          )}

          <View className="flex-row items-center px-4 py-3 border-t border-gray-200 dark:border-gray-800 gap-3">
            <TextInput
              className="flex-1 text-sm text-black dark:text-white py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-[20px] max-h-[100px]"
              placeholder="Add a comment..."
              placeholderTextColor="#8E8E93"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={() => handleSubmitComment()}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              <Ionicons
                name="send"
                size={24}
                color={newComment.trim() ? "#007AFF" : "#8E8E93"}
              />
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

