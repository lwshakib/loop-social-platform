import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../store/userStore";

export default function SignIn() {
  const router = useRouter();
  const setUserData = useUserStore((state) => state.setUserData);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "";

      if (!serverUrl) {
        setError(
          "Server URL is not configured. Please set EXPO_PUBLIC_SERVER_URL in your .env file"
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${serverUrl}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data;

        // Store tokens
        if (userData.accessToken) {
          await AsyncStorage.setItem("accessToken", userData.accessToken);
        }
        if (userData.refreshToken) {
          await AsyncStorage.setItem("refreshToken", userData.refreshToken);
        }
        if (userData.id) {
          await AsyncStorage.setItem("userId", userData.id.toString());
        }

        // Store user data in Zustand store (excluding tokens)
        const userDataWithoutTokens = { ...userData };
        delete userDataWithoutTokens.accessToken;
        delete userDataWithoutTokens.refreshToken;
        setUserData(userDataWithoutTokens);

        // Navigate to home
        router.replace("/(home)/(tabs)/home");
      } else {
        // Try to parse error response, but handle non-JSON responses
        let errorMessage = "Failed to sign in. Please check your credentials.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage =
              errorData.message ||
              errorData.error ||
              errorData.data?.message ||
              errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server returned status ${response.status}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Provide more helpful error message
      const errorMessage =
        error instanceof TypeError && error.message === "Network request failed"
          ? "Network request failed. Common causes:\n• Server URL might be incorrect\n• On Android emulator, use 10.0.2.2 instead of localhost\n• On physical device, use your computer's IP address\n• Make sure the server is running and accessible"
          : error instanceof Error
            ? error.message
            : "An error occurred. Please try again.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12 pb-8">
            {/* Header */}
            <View className="mb-12">
              <View className="mb-6">
                <Text className="text-5xl font-bold text-blue-600 dark:text-blue-500 text-center">
                  Loop
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                  Social Media Platform
                </Text>
              </View>
              <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-300">
                Sign in to continue to your Loop account
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                />
              </View>

              {/* Error Message */}
              {error && (
                <View className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <Text className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="w-full bg-blue-600 dark:bg-blue-500 py-4 rounded-lg mb-4"
                onPress={handleSignIn}
                disabled={isLoading || !email || !password}
                style={{
                  opacity: isLoading || !email || !password ? 0.6 : 1,
                }}
              >
                <Text className="text-white text-center text-base font-semibold">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="self-center">
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className="px-4 text-sm text-gray-500 dark:text-gray-400">
                OR
              </Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 dark:text-gray-300 text-sm">
                Don&apos;t have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
