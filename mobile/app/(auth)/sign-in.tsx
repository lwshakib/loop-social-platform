import { Link, Stack } from "expo-router";
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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    // TODO: Implement sign in logic
    setTimeout(() => {
      setIsLoading(false);
      // router.replace("/(tabs)");
    }, 1000);
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
              <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-300">
                Sign in to continue to your account
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
