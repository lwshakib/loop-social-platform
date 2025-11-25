import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../../store/userStore";

type RecentSearch = {
  id: number;
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
  followers: number;
};

type SearchResult = {
  id: string;
  username: string;
  firstName?: string;
  surName?: string;
  profileImage?: string;
  isVerified?: boolean;
  followers?: number;
};

const ACCESS_TOKEN_KEY = "accessToken";
const RECENT_SEARCHES_KEY = "recentSearches";

// Helper to get server URL
const getServerUrl = (): string => {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
};

// Load recent searches from AsyncStorage
const loadRecentSearches = async (): Promise<RecentSearch[]> => {
  try {
    const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading recent searches:", error);
  }
  return [];
};

// Save recent searches to AsyncStorage
const saveRecentSearches = async (searches: RecentSearch[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Error saving recent searches:", error);
  }
};

export default function SearchScreen() {
  const router = useRouter();
  const { getAvatarUrl } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      const recent = await loadRecentSearches();
      setRecentSearches(recent);
    };
    loadRecent();
  }, []);

  // Search users API call
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      try {
        setIsSearching(true);
        const serverUrl = getServerUrl();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(
          `${serverUrl}/users/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20`,
          {
            method: "GET",
            headers,
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setSearchResults(result.data);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserClick = async (username: string) => {
    // Navigate to profile (for now, just show alert - you can implement profile navigation)
    router.push(`/(home)/(tabs)/profile`);
    setSearchQuery("");

    // Add to recent searches
    const userResult = searchResults.find((r) => r.username === username);
    if (userResult) {
      const newSearch: RecentSearch = {
        id: Date.now(),
        username: userResult.username,
        fullName:
          `${userResult.firstName || ""} ${userResult.surName || ""}`.trim() ||
          userResult.username,
        avatar: userResult.profileImage || "",
        isVerified: userResult.isVerified || false,
        followers: userResult.followers || 0,
      };

      setRecentSearches((prev) => {
        // Remove if already exists to avoid duplicates
        const filtered = prev.filter((s) => s.username !== username);
        // Add to beginning and limit to 10 most recent
        const updated = [newSearch, ...filtered].slice(0, 10);
        saveRecentSearches(updated);
        return updated;
      });
    }
  };

  const handleClearRecent = async () => {
    setRecentSearches([]);
    await saveRecentSearches([]);
  };

  const handleRemoveRecent = async (id: number) => {
    const updated = recentSearches.filter((search) => search.id !== id);
    setRecentSearches(updated);
    await saveRecentSearches(updated);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const avatarUrl =
      item.profileImage ||
      getAvatarUrl() ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`;

    return (
      <TouchableOpacity
        className="flex-row items-center py-3 gap-3"
        onPress={() => handleUserClick(item.username)}
      >
        <Image
          source={{ uri: avatarUrl }}
          className="w-12 h-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text className="text-base font-semibold text-black dark:text-white">
              {item.username}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>
          {(item.firstName || item.surName) && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              {item.firstName} {item.surName}
            </Text>
          )}
          {item.followers !== undefined && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {item.followers.toLocaleString()} followers
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentSearch = ({ item }: { item: RecentSearch }) => {
    const avatarUrl =
      item.avatar ||
      getAvatarUrl() ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`;

    return (
      <TouchableOpacity
        className="flex-row items-center py-3 gap-3"
        onPress={() => handleUserClick(item.username)}
      >
        <Image
          source={{ uri: avatarUrl }}
          className="w-12 h-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text className="text-base font-semibold text-black dark:text-white">
              {item.username}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>
          {item.fullName && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              {item.fullName}
            </Text>
          )}
          {item.followers > 0 && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {item.followers.toLocaleString()} followers
            </Text>
          )}
        </View>
        <TouchableOpacity
          className="p-1"
          onPress={() => handleRemoveRecent(item.id)}
        >
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
      {/* Search Header */}
      <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <Text className="text-2xl font-bold text-black dark:text-white">
          Search
        </Text>
      </View>

      {/* Search Input */}
      <View className="px-4 py-2 bg-white dark:bg-black">
        <View className="flex-row items-center px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700">
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            className="flex-1 ml-2 text-base text-black dark:text-white"
            placeholder="Search users..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="ml-2 w-6 h-6 items-center justify-center"
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results or Recent Searches */}
      {searchQuery ? (
        isSearching ? (
          <View className="flex-1 justify-center items-center py-12 bg-white dark:bg-black">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Searching...
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            className="bg-white dark:bg-black"
          />
        ) : (
          <View className="flex-1 justify-center items-center py-12 bg-white dark:bg-black">
            <Text className="text-base text-gray-500 dark:text-gray-400">
              No results found
            </Text>
          </View>
        )
      ) : recentSearches.length > 0 ? (
        <View className="flex-1 bg-white dark:bg-black">
          <View className="flex-row justify-between items-center px-4 py-3">
            <Text className="text-base font-semibold text-black dark:text-white">
              Recent
            </Text>
            <TouchableOpacity onPress={handleClearRecent}>
              <Text className="text-sm text-blue-500 dark:text-blue-400 font-semibold">
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearch}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            className="bg-white dark:bg-black"
          />
        </View>
      ) : (
        <View className="flex-1 justify-center items-center py-12 bg-white dark:bg-black">
          <Text className="text-base text-gray-500 dark:text-gray-400">
            No recent searches
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
