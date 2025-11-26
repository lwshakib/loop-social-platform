import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../store/userStore";

type Post = {
  id: string;
  userId: string;
  user?: {
    id: string;
    username?: string;
    firstName?: string;
    surName?: string;
    profileImage?: string;
  };
  caption?: string;
  url: string;
  type: "video";
  likesCount: number;
  commentsCount: number;
  viewsCount?: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

const ACCESS_TOKEN_KEY = "accessToken";

const getServerUrl = () => process.env.EXPO_PUBLIC_SERVER_URL || "";

const formatCount = (num: number | undefined) => {
  if (!num) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

// Video Player Component with proper player management
const VideoPlayerComponent = ({
  videoUrl,
  isPlaying,
  onTogglePlay,
}: {
  videoUrl: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) => {
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  return (
    <View className="flex-1 bg-black">
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls={false}
      />

      <TouchableOpacity
        className="absolute inset-0 items-center justify-center"
        activeOpacity={0.7}
        onPress={onTogglePlay}
      >
        {!isPlaying && (
          <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
            <Ionicons name="play" size={36} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function SingleReelScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const router = useRouter();
  const { getAvatarUrl } = useUserStore();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const serverUrl = getServerUrl();
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      const response = await fetch(`${serverUrl}/posts/${postId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load reel");
      }

      const result = await response.json();

      if (result.data?.post) {
        const normalized: Post = {
          ...result.data.post,
          id:
            result.data.post._id?.toString() ||
            result.data.post.id?.toString() ||
            result.data.post.id,
          user: result.data.post.user || {},
          url: result.data.post.url || "",
          type: "video",
          likesCount: result.data.post.likesCount || 0,
          commentsCount: result.data.post.commentsCount || 0,
          viewsCount: result.data.post.viewsCount || 0,
          createdAt: result.data.post.createdAt || new Date().toISOString(),
          isLiked: !!result.data.post.isLiked,
          isSaved: !!result.data.post.isSaved,
        };

        setPost(normalized);
        setIsLiked(!!normalized.isLiked);
        setIsSaved(!!normalized.isSaved);
      }
    } catch (error) {
      console.error("Error fetching reel:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load reel"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLikeToggle = useCallback(async () => {
    if (!post) return;
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      Alert.alert("Error", "Please login to like this reel");
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setPost((prev) =>
      prev
        ? {
            ...prev,
            likesCount: nextLiked
              ? prev.likesCount + 1
              : Math.max(0, prev.likesCount - 1),
          }
        : prev
    );

    try {
      const method = nextLiked ? "POST" : "DELETE";
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/posts/${post.id}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to update like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked(!nextLiked);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likesCount: !nextLiked
                ? prev.likesCount + 1
                : Math.max(0, prev.likesCount - 1),
            }
          : prev
      );
      Alert.alert("Error", "Could not update like status");
    }
  }, [isLiked, post]);

  const handleSaveToggle = useCallback(async () => {
    if (!post) return;
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      Alert.alert("Error", "Please login to save this reel");
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const method = nextSaved ? "POST" : "DELETE";
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/posts/${post.id}/saved`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to update save");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setIsSaved(!nextSaved);
      Alert.alert("Error", "Could not update save status");
    }
  }, [isSaved, post]);

  const displayName = useMemo(() => {
    if (!post?.user) return "Unknown";
    if (post.user.firstName && post.user.surName) {
      return `${post.user.firstName} ${post.user.surName}`;
    }
    return post.user.username || "Unknown";
  }, [post]);

  if (isLoading || !post) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-lg text-white font-semibold">Reel</Text>
        <View style={{ width: 32 }} />
      </View>

      <View className="flex-1">
        <VideoPlayerComponent
          videoUrl={post.url}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((prev) => !prev)}
        />

        <View className="absolute bottom-6 right-4 gap-5">
          <TouchableOpacity
            className="items-center gap-1"
            onPress={handleLikeToggle}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={30}
              color={isLiked ? "#EF4444" : "#FFFFFF"}
            />
            <Text className="text-white text-xs font-semibold">
              {formatCount(post.likesCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center gap-1"
            onPress={handleSaveToggle}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={30}
              color={isSaved ? "#FBBF24" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 py-4 bg-black">
        <View className="flex-row items-center gap-3 mb-3">
          <Image
            source={{
              uri:
                post.user?.profileImage ||
                getAvatarUrl() ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username || "user"}`,
            }}
            className="w-12 h-12 rounded-full"
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-white font-semibold">{displayName}</Text>
            <Text className="text-gray-400 text-sm">
              @{post.user?.username || "unknown"} ·{" "}
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
          <TouchableOpacity className="px-4 py-2 rounded-full bg-white/10">
            <Text className="text-white text-sm font-semibold">Follow</Text>
          </TouchableOpacity>
        </View>

        {post.caption && (
          <Text className="text-white text-base leading-6 mb-4">
            {post.caption}
          </Text>
        )}

        <View className="flex-row gap-6">
          <View>
            <Text className="text-white text-lg font-semibold">
              {formatCount(post.viewsCount || 0)}
            </Text>
            <Text className="text-gray-400 text-xs uppercase tracking-wide">
              Views
            </Text>
          </View>
          <View>
            <Text className="text-white text-lg font-semibold">
              {formatCount(post.commentsCount)}
            </Text>
            <Text className="text-gray-400 text-xs uppercase tracking-wide">
              Comments
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
