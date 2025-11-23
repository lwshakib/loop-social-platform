import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return;
    }

    if (password !== confirmPassword) {
      // TODO: Show error message
      return;
    }

    setIsLoading(true);
    // TODO: Implement sign up logic
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
                Create account
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-300">
                Sign up to get started
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect={false}
                />
              </View>

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

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                className="w-full bg-blue-600 dark:bg-blue-500 py-4 rounded-lg mb-4"
                onPress={handleSignUp}
                disabled={
                  isLoading ||
                  !name ||
                  !email ||
                  !password ||
                  !confirmPassword
                }
                style={{
                  opacity:
                    isLoading ||
                    !name ||
                    !email ||
                    !password ||
                    !confirmPassword
                      ? 0.6
                      : 1,
                }}
              >
                <Text className="text-white text-center text-base font-semibold">
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className="px-4 text-sm text-gray-500 dark:text-gray-400">OR</Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 dark:text-gray-300 text-sm">
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                    Sign In
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

