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
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

type Comment = {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  comment: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  replies?: Comment[];
  replyCount?: number;
};

const ACCESS_TOKEN_KEY = "accessToken";

// Helper to get server URL
const getServerUrl = (): string => {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
};

// Helper function to format numbers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return "0";
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper function to format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
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

export default function ReelsScreen() {
  const router = useRouter();
  const { getAvatarUrl } = useUserStore();
  const [videos, setVideos] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Post | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      const serverUrl = getServerUrl();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        Alert.alert("Error", "You must be logged in to view reels");
        return;
      }

      const response = await fetch(`${serverUrl}/posts?limit=100`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.posts) {
          // Filter only video posts
          const videoPosts = result.data.posts.filter(
            (post: Post) => post.type === "video"
          );

          setVideos(videoPosts);

          // Initialize liked and saved posts
          const likedPostIds = videoPosts
            .filter((post: Post) => post.isLiked)
            .map((post: Post) => post.id);
          setLikedPosts(new Set(likedPostIds));

          const savedPostIds = videoPosts
            .filter((post: Post) => post.isSaved)
            .map((post: Post) => post.id);
          setSavedPosts(new Set(savedPostIds));
        }
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to load videos");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      Alert.alert("Error", "Failed to load videos");
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle video viewability change
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0];
        setCurrentVideoIndex(visibleItem.index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (postId: string) => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

    const isLiked = likedPosts.has(postId);
    const serverUrl = getServerUrl();

    // Get current likes count for revert
    const currentVideo = videos.find((v) => v.id === postId);
    const previousLikesCount = currentVideo?.likesCount || 0;

    // Optimistic update
    if (isLiked) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setVideos((prev) =>
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
      setVideos((prev) =>
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
        setVideos((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: previousLikesCount }
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
      setVideos((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: previousLikesCount }
            : post
        )
      );
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

  // Fetch comments when modal opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedVideo?.id || !isCommentsModalOpen) {
        setComments([]);
        return;
      }

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return;
      }

      try {
        setIsLoadingComments(true);
        const serverUrl = getServerUrl();
        const response = await fetch(
          `${serverUrl}/posts/${selectedVideo.id}/comments`,
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
  }, [selectedVideo?.id, isCommentsModalOpen]);

  const handleSubmitComment = async (parentId?: string) => {
    const commentText = parentId
      ? replyText[parentId]?.trim()
      : newComment.trim();

    if (!commentText || !selectedVideo?.id) {
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
        `${serverUrl}/posts/${selectedVideo.id}/comments`,
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
            setReplyText((prev) => ({ ...prev, [parentId]: "" }));
            setReplyingTo(null);
          } else {
            setComments((prev) => [result.data.comment, ...prev]);
            setNewComment("");
          }

          setVideos((prev) =>
            prev.map((video) =>
              video.id === selectedVideo.id
                ? { ...video, commentsCount: video.commentsCount + 1 }
                : video
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

  const renderVideoItem = ({ item, index }: { item: Post; index: number }) => {
    const screenHeight = Dimensions.get("window").height;
    const isMuted = mutedVideos.has(item.id);
    const isLiked = likedPosts.has(item.id);
    const isSaved = savedPosts.has(item.id);

    return (
      <View className="w-full relative" style={{ height: screenHeight }}>
        <VideoPlayer
          videoUrl={item.url}
          isMuted={isMuted}
          shouldPlay={index === currentVideoIndex}
        />

        {/* Mute/Unmute Button - Top Right */}
        <TouchableOpacity
          className="absolute top-[50px] right-4 p-2 rounded-[20px] bg-black/50"
          onPress={() => {
            if (isMuted) {
              setMutedVideos((prev) => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
            } else {
              setMutedVideos((prev) => {
                const newSet = new Set(prev);
                newSet.add(item.id);
                return newSet;
              });
            }
          }}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Right Side Actions */}
        <View className="absolute right-4 bottom-[100px] items-center gap-6">
          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#EF4444" : "#FFFFFF"}
            />
            <Text className="text-white text-xs font-semibold">{formatNumber(item.likesCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => {
              setSelectedVideo(item);
              setIsCommentsModalOpen(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
            <Text className="text-white text-xs font-semibold">
              {formatNumber(item.commentsCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => handleSave(item.id)}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={32}
              color={isSaved ? "#FBBF24" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View className="absolute bottom-[50px] left-4 right-20">
          {item.user && (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => {
                  if (item.user?.username) {
                    router.push(`/(home)/(tabs)/profile`);
                  }
                }}
              >
                <Image
                  source={{
                    uri:
                      item.user.profileImage ||
                      getAvatarUrl() ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.username}`,
                  }}
                  className="w-8 h-8 rounded-2xl border-2 border-white"
                  contentFit="cover"
                />
              </TouchableOpacity>
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => {
                    if (item.user?.username) {
                      router.push(`/(home)/(tabs)/profile`);
                    }
                  }}
                >
                  <Text className="text-white text-sm font-semibold mb-1">
                    @{item.user.username || "unknown"}
                  </Text>
                </TouchableOpacity>
                {item.caption && (
                  <Text className="text-white text-sm leading-[18px]" numberOfLines={2}>
                    {item.caption}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (videos.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="text-base text-white mt-3">Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={[]}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={Dimensions.get("window").height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />

      {/* Comments Modal */}
      <Modal
        visible={isCommentsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCommentsModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Text className="text-lg font-semibold text-black dark:text-white">Comments</Text>
            <TouchableOpacity onPress={() => setIsCommentsModalOpen(false)}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {isLoadingComments ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : comments.length === 0 ? (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row gap-3 mb-4">
                  <Image
                    source={{
                      uri:
                        item.user?.profileImage ||
                        getAvatarUrl() ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username || "user"}`,
                    }}
                    className="w-8 h-8 rounded-2xl"
                    contentFit="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-sm font-semibold text-black dark:text-white">
                        @{item.user?.username || "unknown"}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-sm text-black dark:text-white leading-5 mb-2">{item.comment}</Text>
                    <TouchableOpacity
                      className="mt-1"
                      onPress={() => {
                        setReplyingTo(replyingTo === item.id ? null : item.id);
                        if (replyingTo !== item.id) {
                          setReplyText((prev) => ({ ...prev, [item.id]: "" }));
                        }
                      }}
                    >
                      <Text className="text-xs text-gray-500 dark:text-gray-400">Reply</Text>
                    </TouchableOpacity>
                    {replyingTo === item.id && (
                      <View className="mt-2 flex-row gap-2 items-end">
                        <TextInput
                          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm max-h-[100px] text-black dark:text-white"
                          placeholder={`Reply to @${item.user?.username || "user"}...`}
                          placeholderTextColor="#8E8E93"
                          value={replyText[item.id] || ""}
                          onChangeText={(text) =>
                            setReplyText((prev) => ({ ...prev, [item.id]: text }))
                          }
                          multiline
                        />
                        <TouchableOpacity
                          className={`px-4 py-2 rounded-lg ${(!replyText[item.id]?.trim() || isSubmittingComment) ? "opacity-50 bg-gray-300 dark:bg-gray-700" : "bg-blue-500"}`}
                          onPress={() => handleSubmitComment(item.id)}
                          disabled={
                            !replyText[item.id]?.trim() || isSubmittingComment
                          }
                        >
                          <Text className="text-white text-sm font-semibold">Send</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}

          {/* Comment Input */}
          <View className="flex-row p-4 border-t border-gray-200 dark:border-gray-800 gap-2 items-end">
            <TextInput
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm max-h-[100px] text-black dark:text-white"
              placeholder="Add a comment..."
              placeholderTextColor="#8E8E93"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${(!newComment.trim() || isSubmittingComment) ? "opacity-50 bg-gray-300 dark:bg-gray-700" : "bg-blue-500"}`}
              onPress={() => handleSubmitComment()}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              <Text className="text-white text-sm font-semibold">
                {isSubmittingComment ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

