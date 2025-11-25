import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Link, Tabs, useRouter } from "expo-router";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../../store/userStore";

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { userData, getAvatarUrl } = useUserStore();
  const avatarUrl = userData ? getAvatarUrl() : null;
  const isActive = color === "#007AFF";

  if (avatarUrl) {
    return (
      <View
        className="rounded-full overflow-hidden border"
        style={{
          width: size,
          height: size,
          borderColor: isActive ? "#007AFF" : "transparent",
          borderWidth: isActive ? 2 : 0,
        }}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    );
  }

  return <Ionicons name="person" size={size} color={color} />;
}

function HomeHeader() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const clearUserData = useUserStore((state) => state.clearUserData);

  const handleLogout = async () => {
    try {
      // Clear tokens and user-related data from storage
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);
      // Clear Zustand user store
      clearUserData();
      // Navigate to sign-in screen
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <SafeAreaView
      className="flex-row justify-between items-center px-4 py-2"
      style={{ backgroundColor: isDark ? "#000000" : "#FFFFFF" }}
    >
      <Text
        className="text-4xl font-bold"
        style={{ color: isDark ? "#FFFFFF" : "#000000" }}
      >
        Loop
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Link href="/notifications" asChild>
          <TouchableOpacity>
            <Ionicons
              name="heart-outline"
              size={24}
              color={isDark ? "#FFFFFF" : "#000000"}
            />
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ marginLeft: 16 }}
          accessibilityLabel="Log out"
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#FFFFFF" : "#000000",
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#8E8E93",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ProfileTabIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
