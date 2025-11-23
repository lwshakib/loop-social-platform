import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";

// Generate arrays for date pickers
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
  (currentYear - i).toString()
);

export default function SignUp() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const totalPages = 4; // Always 4 pages, but 4th is only accessible after OTP is generated

  const validatePage = (page: number): boolean => {
    switch (page) {
      case 0:
        return !!(firstName && surname && day && month && year && gender);
      case 1:
        return !!(username && email);
      case 2:
        return !!(password && confirmPassword && password === confirmPassword);
      case 3:
        return !!otp;
      default:
        return false;
    }
  };

  const goToNextPage = async () => {
    if (!validatePage(currentPage)) {
      // TODO: Show error message
      return;
    }

    // If on page 2 (password page) and email is filled, generate OTP first
    if (currentPage === 2 && email && !otpGenerated) {
      const success = await generateOTP(email);
      // Move to OTP page after successful generation
      if (success && pagerRef.current) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          pagerRef.current?.setPage(3);
        }, 100);
      }
      return;
    }

    // Prevent going to page 4 if OTP hasn't been generated
    if (currentPage === 2 && !otpGenerated) {
      // This should have been handled above, but as a safety check
      return;
    }

    if (currentPage < totalPages - 1) {
      // Only allow going to page 4 if OTP is generated
      if (currentPage === 2 && !otpGenerated) {
        return;
      }
      pagerRef.current?.setPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      pagerRef.current?.setPage(currentPage - 1);
    }
  };

  const generateOTP = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "";

      if (!serverUrl) {
        console.error(
          "Server URL is not configured. Please set EXPO_PUBLIC_SERVER_URL"
        );
        // TODO: Show error toast
        return false;
      }

      const response = await fetch(`${serverUrl}/auth/send-otp-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setOtpGenerated(true);
        // TODO: Show success toast
        return true;
      } else {
        // Try to parse error response, but handle non-JSON responses
        let errorMessage = "Failed to generate OTP";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server returned status ${response.status}`;
        }
        // TODO: Show error toast
        console.error("Failed to generate OTP:", errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Error generating OTP:", error);
      // TODO: Show error toast
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!otp) {
      // TODO: Show error message
      return;
    }

    setIsLoading(true);
    try {
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "";

      if (!serverUrl) {
        console.error(
          "Server URL is not configured. Please set EXPO_PUBLIC_SERVER_URL"
        );
        // TODO: Show error toast
        setIsLoading(false);
        return;
      }

      const dateOfBirth = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      const submitData = {
        firstName,
        surname,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        username,
        email,
        password,
        otp,
      };

      const response = await fetch(`${serverUrl}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // TODO: Navigate to home
        // router.replace("/(tabs)");
      } else {
        // Try to parse error response, but handle non-JSON responses
        let errorMessage = "Failed to sign up";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server returned status ${response.status}`;
        }
        // TODO: Show error toast
        console.error("Sign up failed:", errorMessage);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  // Page 1: Personal Info
  const renderPage1 = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-6 pt-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Information
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Tell us about yourself
        </Text>
      </View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name
          </Text>
          <TextInput
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
            placeholder="John"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
            autoCorrect={false}
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Surname
          </Text>
          <TextInput
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
            placeholder="Doe"
            placeholderTextColor="#9CA3AF"
            value={surname}
            onChangeText={setSurname}
            autoCapitalize="words"
            autoComplete="family-name"
            autoCorrect={false}
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date of Birth
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            onPress={() => setShowDayPicker(true)}
          >
            <Text
              className={`text-base ${
                day
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {day || "Day"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            onPress={() => setShowMonthPicker(true)}
          >
            <Text
              className={`text-base ${
                month
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {month ? months.find((m) => m.value === month)?.label : "Month"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            onPress={() => setShowYearPicker(true)}
          >
            <Text
              className={`text-base ${
                year
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {year || "Year"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Gender
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            className={`flex-1 px-4 py-3 rounded-lg border ${
              gender === "male"
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
            onPress={() => setGender("male")}
          >
            <Text
              className={`text-center text-base font-medium ${
                gender === "male"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 px-4 py-3 rounded-lg border ${
              gender === "female"
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
            onPress={() => setGender("female")}
          >
            <Text
              className={`text-center text-base font-medium ${
                gender === "female"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 px-4 py-3 rounded-lg border ${
              gender === "other"
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
            onPress={() => setGender("other")}
          >
            <Text
              className={`text-center text-base font-medium ${
                gender === "other"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Other
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Page 2: Account Info
  const renderPage2 = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-6 pt-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Account Details
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Create your Loop account
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Username
        </Text>
        <View className="relative">
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10 pointer-events-none">
            <Text className="text-base text-gray-500 dark:text-gray-400 font-medium">
              @
            </Text>
          </View>
          <TextInput
            className="w-full px-4 pl-8 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
            placeholder="username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white"
          placeholder="name@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          An OTP will be sent to this email for verification
        </Text>
      </View>
    </ScrollView>
  );

  // Page 3: Security
  const renderPage3 = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-6 pt-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Security
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Set up your password
        </Text>
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
        {password && confirmPassword && password !== confirmPassword && (
          <Text className="text-xs text-red-500 mt-1">
            Passwords do not match
          </Text>
        )}
      </View>
    </ScrollView>
  );

  // Page 4: OTP Verification
  const renderPage4 = () => (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-6 pt-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Email
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Enter the OTP sent to {email}
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter OTP
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white text-center"
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          Check your email for the verification code
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="mb-4">
            <Text className="text-4xl font-bold text-blue-600 dark:text-blue-500 text-center">
              Loop
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Social Media Platform
            </Text>
          </View>
        </View>

        {/* PagerView */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
          onPageScroll={(e) => {
            const { offset, position } = e.nativeEvent;
            scrollX.setValue(position + offset);
          }}
        >
          <View key="1" className="flex-1 bg-white dark:bg-gray-900">
            {renderPage1()}
          </View>
          <View key="2" className="flex-1 bg-white dark:bg-gray-900">
            {renderPage2()}
          </View>
          <View key="3" className="flex-1 bg-white dark:bg-gray-900">
            {renderPage3()}
          </View>
          <View key="4" className="flex-1 bg-white dark:bg-gray-900">
            {otpGenerated ? (
              renderPage4()
            ) : (
              <View className="flex-1 justify-center items-center px-6">
                <Text className="text-lg text-gray-500 dark:text-gray-400 text-center">
                  Please complete the previous steps first
                </Text>
              </View>
            )}
          </View>
        </PagerView>

        {/* Navigation Buttons */}
        <View className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row gap-3">
            {currentPage > 0 && (
              <TouchableOpacity
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                onPress={goToPreviousPage}
              >
                <Text className="text-center text-base font-semibold text-gray-700 dark:text-gray-300">
                  Previous
                </Text>
              </TouchableOpacity>
            )}
            {currentPage < 2 ? (
              <TouchableOpacity
                className={`flex-1 px-6 py-3 rounded-lg ${
                  validatePage(currentPage)
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
                onPress={goToNextPage}
                disabled={!validatePage(currentPage)}
              >
                <Text className="text-center text-base font-semibold text-white">
                  Next
                </Text>
              </TouchableOpacity>
            ) : currentPage === 2 ? (
              <TouchableOpacity
                className={`flex-1 px-6 py-3 rounded-lg ${
                  validatePage(currentPage) && !isLoading
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
                onPress={goToNextPage}
                disabled={!validatePage(currentPage) || isLoading}
              >
                <Text className="text-center text-base font-semibold text-white">
                  {isLoading ? "Sending OTP..." : "Next"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`flex-1 px-6 py-3 rounded-lg ${
                  validatePage(currentPage) && !isLoading
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
                onPress={handleSignUp}
                disabled={!validatePage(currentPage) || isLoading}
              >
                <Text className="text-center text-base font-semibold text-white">
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Page Indicators */}
        <View className="px-6 pb-4">
          <View className="flex-row justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => {
              const inputRange = [index - 1, index, index + 1];
              const width = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                  style={{
                    width,
                    opacity,
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Sign In Link */}
        <View className="px-6 pb-6">
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

        {/* Date Picker Modals */}
        <Modal
          visible={showDayPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDayPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowDayPicker(false)}
          >
            <Pressable
              className="bg-white dark:bg-gray-800 rounded-t-3xl max-h-[50%]"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Day
                </Text>
              </View>
              <ScrollView className="max-h-64">
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    className={`px-4 py-3 ${
                      day === d
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-800"
                    }`}
                    onPress={() => {
                      setDay(d);
                      setShowDayPicker(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        day === d
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showMonthPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowMonthPicker(false)}
          >
            <Pressable
              className="bg-white dark:bg-gray-800 rounded-t-3xl max-h-[50%]"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Month
                </Text>
              </View>
              <ScrollView className="max-h-64">
                {months.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    className={`px-4 py-3 ${
                      month === m.value
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-800"
                    }`}
                    onPress={() => {
                      setMonth(m.value);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        month === m.value
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showYearPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowYearPicker(false)}
          >
            <Pressable
              className="bg-white dark:bg-gray-800 rounded-t-3xl max-h-[50%]"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Year
                </Text>
              </View>
              <ScrollView className="max-h-64">
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    className={`px-4 py-3 ${
                      year === y
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-800"
                    }`}
                    onPress={() => {
                      setYear(y);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        year === y
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
