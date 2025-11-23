import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Helper to get server URL from environment variables
function getServerUrl(): string {
  return process.env.EXPO_PUBLIC_SERVER_URL || "";
}

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userData, setUserData, clearUserData } = useUserStore();

  const validateAndRefreshToken = useCallback(async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);

      // If no accessToken and no refreshToken, user is not signed in
      if (!accessToken && !refreshToken) {
        setIsSignedIn(false);
        clearUserData();
        setIsLoading(false);
        return;
      }

      const serverUrl = getServerUrl();
      if (!serverUrl) {
        console.error("Server URL is not configured");
        setIsSignedIn(false);
        clearUserData();
        setIsLoading(false);
        return;
      }

      // If accessToken exists, validate it
      if (accessToken) {
        try {
          const response = await fetch(`${serverUrl}/auth/validate-token`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            // Access token is valid, get user data
            const result = await response.json();
            if (result.data) {
              // Store user data in Zustand store (which persists to AsyncStorage)
              setUserData(result.data);
            }
            setIsSignedIn(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // If validation fails, try to refresh
          console.error("Token validation failed:", error);
        }
      }

      // If no accessToken or accessToken is invalid, try to refresh using refreshToken
      if (refreshToken) {
        try {
          const response = await fetch(`${serverUrl}/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data?.accessToken) {
              // Save new access token
              await AsyncStorage.setItem(
                ACCESS_TOKEN_KEY,
                result.data.accessToken
              );

              // Fetch user data after token refresh
              try {
                const validateResponse = await fetch(
                  `${serverUrl}/auth/validate-token`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${result.data.accessToken}`,
                    },
                  }
                );
                if (validateResponse.ok) {
                  const validateResult = await validateResponse.json();
                  if (validateResult.data) {
                    // Store user data in Zustand store (which persists to AsyncStorage)
                    setUserData(validateResult.data);
                  }
                }
              } catch (error) {
                console.error("Error fetching user data after refresh:", error);
              }

              setIsSignedIn(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }

      // If refreshToken is invalid or doesn't exist, user is not signed in
      setIsSignedIn(false);
      clearUserData();
      setIsLoading(false);
    } catch (error) {
      console.error("Error validating tokens:", error);
      setIsSignedIn(false);
      clearUserData();
      setIsLoading(false);
    }
  }, [setUserData, clearUserData]);

  useEffect(() => {
    validateAndRefreshToken();
  }, [validateAndRefreshToken]);

  const checkAuthStatus = async () => {
    await validateAndRefreshToken();
  };

  return {
    isSignedIn,
    isLoading,
    userData,
    checkAuthStatus,
  };
}
