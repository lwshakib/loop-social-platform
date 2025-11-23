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
  StyleSheet,
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

    return <VideoView player={player} style={styles.video} contentFit="cover" />;
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
      <View style={[styles.videoContainer, { height: screenHeight }]}>
        <VideoPlayer
          videoUrl={item.url}
          isMuted={isMuted}
          shouldPlay={index === currentVideoIndex}
        />

        {/* Mute/Unmute Button - Top Right */}
        <TouchableOpacity
          style={styles.muteButton}
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
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#EF4444" : "#FFFFFF"}
            />
            <Text style={styles.actionText}>{formatNumber(item.likesCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedVideo(item);
              setIsCommentsModalOpen(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {formatNumber(item.commentsCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
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
        <View style={styles.bottomInfo}>
          {item.user && (
            <View style={styles.userInfo}>
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
                  style={styles.userAvatar}
                  contentFit="cover"
                />
              </TouchableOpacity>
              <View style={styles.userDetails}>
                <TouchableOpacity
                  onPress={() => {
                    if (item.user?.username) {
                      router.push(`/(home)/(tabs)/profile`);
                    }
                  }}
                >
                  <Text style={styles.username}>
                    @{item.user.username || "unknown"}
                  </Text>
                </TouchableOpacity>
                {item.caption && (
                  <Text style={styles.caption} numberOfLines={2}>
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
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
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setIsCommentsModalOpen(false)}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {isLoadingComments ? (
            <View style={styles.commentsLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyCommentsContainer}>
              <Text style={styles.emptyCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{
                      uri:
                        item.user?.profileImage ||
                        getAvatarUrl() ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username || "user"}`,
                    }}
                    style={styles.commentAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>
                        @{item.user?.username || "unknown"}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{item.comment}</Text>
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => {
                        setReplyingTo(replyingTo === item.id ? null : item.id);
                        if (replyingTo !== item.id) {
                          setReplyText((prev) => ({ ...prev, [item.id]: "" }));
                        }
                      }}
                    >
                      <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                    {replyingTo === item.id && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder={`Reply to @${item.user?.username || "user"}...`}
                          value={replyText[item.id] || ""}
                          onChangeText={(text) =>
                            setReplyText((prev) => ({ ...prev, [item.id]: text }))
                          }
                          multiline
                        />
                        <TouchableOpacity
                          style={[
                            styles.sendButton,
                            (!replyText[item.id]?.trim() ||
                              isSubmittingComment) &&
                              styles.sendButtonDisabled,
                          ]}
                          onPress={() => handleSubmitComment(item.id)}
                          disabled={
                            !replyText[item.id]?.trim() || isSubmittingComment
                          }
                        >
                          <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
              contentContainerStyle={styles.commentsList}
            />
          )}

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmittingComment) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={() => handleSubmitComment()}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              <Text style={styles.sendButtonText}>
                {isSubmittingComment ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoContainer: {
    width: "100%",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  muteButton: {
    position: "absolute",
    top: 50,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  rightActions: {
    position: "absolute",
    right: 16,
    bottom: 100,
    alignItems: "center",
    gap: 24,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomInfo: {
    position: "absolute",
    bottom: 50,
    left: 16,
    right: 80,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  commentsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  commentTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  commentText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    marginTop: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  replyInputContainer: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 8,
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
