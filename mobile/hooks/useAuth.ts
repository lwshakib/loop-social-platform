import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);

      // User is signed in if both tokens exist
      setIsSignedIn(!!(accessToken && refreshToken));
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsSignedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSignedIn,
    isLoading,
    checkAuthStatus,
  };
}
