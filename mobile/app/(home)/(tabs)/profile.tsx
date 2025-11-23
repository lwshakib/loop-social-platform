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
  StyleSheet,
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
        style={[styles.postItem, { width: itemSize, height: itemSize }]}
        onPress={() => {
          setSelectedPost(item);
          setIsPostModalOpen(true);
        }}
      >
        {item.url ? (
          item.type === "video" ? (
            <View style={styles.postVideoContainer}>
              <Image
                source={{ uri: item.url }}
                style={styles.postImage}
                contentFit="cover"
              />
              <View style={styles.playIconOverlay}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: item.url }}
              style={styles.postImage}
              contentFit="cover"
            />
          )
        ) : (
          <View style={styles.postTextContainer}>
            <Text style={styles.postText} numberOfLines={3}>
              {item.caption || "Post"}
            </Text>
          </View>
        )}
        {item.type === "video" && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play-circle" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = `${userData.firstName} ${userData.surName}`;
  const avatarUrl = userData.profileImage || getAvatarUrl();
  const coverImageUrl =
    userData.coverImage || "https://picsum.photos/800/300?random=profile";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <View style={styles.actionButtons}>
              {isOwnProfile ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditProfileClick}
                >
                  <Ionicons name="create-outline" size={18} color="#007AFF" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.messageButton}>
                    <Ionicons name="chatbubble-outline" size={18} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      isFollowing && styles.followingButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.followButtonText,
                        isFollowing && styles.followingButtonText,
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={18} color="#000000" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>@{userData.username}</Text>
            {userData.bio && <Text style={styles.bio}>{userData.bio}</Text>}
            <View style={styles.joinDateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text style={styles.joinDate}>
                Joined {formatDate(userData.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userData.following.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userData.followers.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setActiveTab("posts")}
            >
              <Text style={styles.statNumber}>
                {userData.postsCount.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}
          >
            <Ionicons
              name="grid"
              size={20}
              color={activeTab === "posts" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reels" && styles.activeTab]}
            onPress={() => setActiveTab("reels")}
          >
            <Ionicons
              name="play-circle"
              size={20}
              color={activeTab === "reels" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "liked" && styles.activeTab]}
            onPress={() => setActiveTab("liked")}
          >
            <Ionicons
              name="heart"
              size={20}
              color={activeTab === "liked" ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "saved" && styles.activeTab]}
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
          <View style={styles.postsLoadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyPostsContainer}>
            <Text style={styles.emptyPostsText}>
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
            contentContainerStyle={styles.postsGrid}
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={isUploading}
            >
              <Text
                style={[
                  styles.modalSaveButton,
                  isUploading && styles.modalSaveButtonDisabled,
                ]}
              >
                {isUploading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={editFormData.firstName}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="First name"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Surname</Text>
              <TextInput
                style={styles.input}
                value={editFormData.surName}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, surName: text }))
                }
                placeholder="Surname"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={editFormData.username}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, username: text }))
                }
                placeholder="Username"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editFormData.bio}
                onChangeText={(text) =>
                  setEditFormData((prev) => ({ ...prev, bio: text }))
                }
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                maxLength={160}
              />
              <Text style={styles.charCount}>
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
        <View style={styles.postModalOverlay}>
          <Pressable
            style={styles.postModalBackdrop}
            onPress={() => setIsPostModalOpen(false)}
          />
          {selectedPost && (
            <View style={styles.postModalContent}>
              <TouchableOpacity
                style={styles.postModalCloseButton}
                onPress={() => setIsPostModalOpen(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {selectedPost.url && (
                <Image
                  source={{ uri: selectedPost.url }}
                  style={styles.postModalImage}
                  contentFit="contain"
                />
              )}
              <View style={styles.postModalActions}>
                <TouchableOpacity
                  style={styles.postModalAction}
                  onPress={() => handleLike(selectedPost.id)}
                >
                  <Ionicons
                    name={likedPosts.has(selectedPost.id) ? "heart" : "heart-outline"}
                    size={24}
                    color={likedPosts.has(selectedPost.id) ? "#EF4444" : "#000000"}
                  />
                  <Text style={styles.postModalActionText}>
                    {selectedPost.likesCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postModalAction}>
                  <Ionicons name="chatbubble-outline" size={24} color="#000000" />
                  <Text style={styles.postModalActionText}>
                    {selectedPost.commentsCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.postModalAction}
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
                <View style={styles.postModalCaption}>
                  <Text style={styles.postModalCaptionText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  coverImageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#E5E5EA",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  profileInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: -60,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#E5E5EA",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  messageButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  followingButtonText: {
    color: "#000000",
  },
  moreButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  userInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
    lineHeight: 20,
  },
  joinDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  joinDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    alignItems: "flex-start",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  postsLoadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyPostsContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyPostsText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  postsGrid: {
    padding: 0.5,
  },
  postItem: {
    margin: 0.5,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postVideoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  postTextContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  postText: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
  },
  videoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
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
  modalCancelButton: {
    fontSize: 16,
    color: "#8E8E93",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    textAlign: "right",
  },
  postModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  postModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  postModalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  postModalCloseButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  postModalImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#000000",
  },
  postModalActions: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  postModalAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postModalActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  postModalCaption: {
    padding: 16,
  },
  postModalCaptionText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
});
