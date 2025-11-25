import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen
          name="notifications"
          options={{ animation: "fade_from_bottom" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
