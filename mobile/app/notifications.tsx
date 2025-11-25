import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginLeft: 12, color: isDark ? "#fff" : "#000" }}>
          Notifications
        </Text>
      </View>
      {/* Placeholder for notification list */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ marginTop: 12, color: isDark ? "#ccc" : "#555" }}>
          No notifications yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}
