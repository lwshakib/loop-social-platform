import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
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
        fullName: `${userResult.firstName || ""} ${userResult.surName || ""}`.trim() || userResult.username,
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
        style={styles.resultItem}
        onPress={() => handleUserClick(item.username)}
      >
        <Image source={{ uri: avatarUrl }} style={styles.resultAvatar} contentFit="cover" />
        <View style={styles.resultInfo}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultUsername}>{item.username}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>
          {(item.firstName || item.surName) && (
            <Text style={styles.resultFullName}>
              {item.firstName} {item.surName}
            </Text>
          )}
          {item.followers !== undefined && (
            <Text style={styles.resultFollowers}>
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
        style={styles.recentItem}
        onPress={() => handleUserClick(item.username)}
      >
        <Image source={{ uri: avatarUrl }} style={styles.recentAvatar} contentFit="cover" />
        <View style={styles.recentInfo}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentUsername}>{item.username}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>
          {item.fullName && (
            <Text style={styles.recentFullName}>{item.fullName}</Text>
          )}
          {item.followers > 0 && (
            <Text style={styles.recentFollowers}>
              {item.followers.toLocaleString()} followers
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveRecent(item.id)}
        >
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results or Recent Searches */}
      {searchQuery ? (
        isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        )
      ) : recentSearches.length > 0 ? (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent</Text>
            <TouchableOpacity onPress={handleClearRecent}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearch}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.recentList}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent searches</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  clearButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  resultUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  resultFullName: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  resultFollowers: {
    fontSize: 12,
    color: "#8E8E93",
  },
  recentContainer: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  clearAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  recentList: {
    paddingHorizontal: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  recentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recentInfo: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  recentUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  recentFullName: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  recentFollowers: {
    fontSize: 12,
    color: "#8E8E93",
  },
  removeButton: {
    padding: 4,
  },
});
