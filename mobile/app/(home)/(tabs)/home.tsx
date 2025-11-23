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

  return <VideoView player={player} style={styles.video} contentFit="cover" />;
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
        style={styles.storyItem}
        onPress={() => {
          if (storyGroup.user?.username && firstStory?.id) {
            router.push(`/stories/@${storyGroup.user.username}/${firstStory.id}`);
          }
        }}
      >
        <View style={styles.storyCircle}>
          <Image
            source={{ uri: storyGroup.user.profileImage || getAvatarUrl() }}
            style={styles.storyAvatar}
            contentFit="cover"
          />
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
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
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/(home)/(tabs)/profile`)}
            style={styles.postHeaderLeft}
          >
            <Image
              source={{ uri: item.userAvatar || getAvatarUrl() }}
              style={styles.postAvatar}
              contentFit="cover"
            />
            <View style={styles.postHeaderInfo}>
              <Text style={styles.postDisplayName}>{item.displayName}</Text>
              <Text style={styles.postUsername}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.postTime}>{item.timeAgo}</Text>
        </View>

        {/* Post Content */}
        {item.content ? (
          <Text style={styles.postContent}>{item.content}</Text>
        ) : null}

        {/* Post Image or Video */}
        {item.postImage && (
          <Image
            source={{ uri: item.postImage }}
            style={styles.postImage}
            contentFit="cover"
          />
        )}
        {item.postVideo && (
          <View style={styles.videoContainer}>
            <VideoPlayer
              videoUrl={item.postVideo}
              isMuted={true}
              shouldPlay={isVideoPlaying}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPost(item);
              setIsCommentsModalOpen(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
            <Text style={styles.actionText}>{formatNumber(item.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#EF4444" : "#000"}
            />
            <Text
              style={[
                styles.actionText,
                isLiked && styles.actionTextLiked,
              ]}
            >
              {formatNumber(item.likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* Stories Section */}
            <View style={styles.storiesContainer}>
              <ScrollView
                ref={storiesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContent}
              >
                {/* Create Story - Current User */}
                {userData && (
                  <TouchableOpacity
                    style={styles.storyItem}
                    onPress={() => {
                      // TODO: Open create story dialog
                      Alert.alert("Coming Soon", "Story creation coming soon!");
                    }}
                  >
                    <View style={[styles.storyCircle, styles.createStoryCircle]}>
                      <Image
                        source={{ uri: getAvatarUrl() }}
                        style={styles.storyAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.createStoryPlus}>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.storyUsername} numberOfLines={1}>
                      Your story
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Other Stories */}
                {isLoadingStories ? (
                  <View style={styles.storyItem}>
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {/* Empty State */}
            {!isLoadingPosts && posts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts available</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={null}
        contentContainerStyle={styles.listContent}
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
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity
              onPress={() => setIsCommentsModalOpen(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {isLoadingComments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{
                      uri: item.user.profileImage || getAvatarUrl(),
                    }}
                    style={styles.commentAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>
                        {item.user.firstName} {item.user.surName}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{item.comment}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setReplyingTo(replyingTo === item.id ? null : item.id);
                      }}
                    >
                      <Text style={styles.replyButton}>
                        {replyingTo === item.id ? "Cancel" : "Reply"}
                      </Text>
                    </TouchableOpacity>
                    {replyingTo === item.id && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Write a reply..."
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
                      <View style={styles.repliesContainer}>
                        {item.replies.map((reply) => (
                          <View key={reply.id} style={styles.replyItem}>
                            <Image
                              source={{
                                uri: reply.user.profileImage || getAvatarUrl(),
                              }}
                              style={styles.replyAvatar}
                              contentFit="cover"
                            />
                            <View style={styles.replyContent}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.commentUsername}>
                                  {reply.user.firstName} {reply.user.surName}
                                </Text>
                                <Text style={styles.commentTime}>
                                  {formatTimeAgo(reply.createdAt)}
                                </Text>
                              </View>
                              <Text style={styles.commentText}>
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
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet</Text>
                </View>
              }
            />
          )}

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 16,
  },
  storiesContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    paddingVertical: 12,
  },
  storiesContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: "center",
    width: 70,
  },
  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    padding: 2,
    marginBottom: 4,
  },
  createStoryCircle: {
    borderColor: "#007AFF",
  },
  storyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  createStoryPlus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  storyUsername: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    maxWidth: 70,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  postContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postDisplayName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  postUsername: {
    fontSize: 15,
    color: "#8E8E93",
  },
  postTime: {
    fontSize: 15,
    color: "#8E8E93",
  },
  postContent: {
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#000",
  },
  actionTextLiked: {
    color: "#EF4444",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  modalCloseButton: {
    padding: 4,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
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
    color: "#000",
  },
  commentTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  commentText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
    marginBottom: 4,
  },
  replyButton: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingLeft: 8,
  },
  replyInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    maxHeight: 100,
  },
  repliesContainer: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E5EA",
  },
  replyItem: {
    flexDirection: "row",
    marginTop: 8,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    maxHeight: 100,
  },
});
