import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useUserStore } from "../../../store/userStore";

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { userData, getAvatarUrl } = useUserStore();
  const avatarUrl = userData ? getAvatarUrl() : null;

  if (avatarUrl) {
    const isActive = color === "#007AFF";
    return (
      <View
        className="rounded-full overflow-hidden border"
        style={{
          width: size,
          height: size,
          borderColor: isActive ? "#007AFF" : "transparent",
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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <ProfileTabIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
