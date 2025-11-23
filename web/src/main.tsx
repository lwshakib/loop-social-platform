import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/store/userStore";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./index.css";
import ExplorePage from "./pages/ExplorePage.tsx";
import HomePage from "./pages/HomePage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ReelsPage from "./pages/ReelsPage.tsx";
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import StoriesPage from "./pages/StoriesPage.tsx";

// Helper function to get cookie value by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

// Helper function to set cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

// Helper to get server URL from environment variables
function getServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL || "";
}

// Protected Route component that checks for accessToken and refreshToken
export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAndRefreshToken = async () => {
  const accessToken = getCookie("accessToken");
      const refreshToken = getCookie("refreshToken");

      // If no accessToken and no refreshToken, redirect to sign-in
      if (!accessToken && !refreshToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // If accessToken exists, validate it
      if (accessToken) {
        try {
          const serverUrl = getServerUrl();
          const response = await fetch(`${serverUrl}/auth/validate-token`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          });

          if (response.ok) {
            // Access token is valid, get user data
            const result = await response.json();
            if (result.data) {
              // Store user data in Zustand store
              useUserStore.getState().setUserData(result.data);
            }
            setIsAuthenticated(true);
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
          const serverUrl = getServerUrl();
          const response = await fetch(`${serverUrl}/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data?.accessToken) {
              // Save new access token (15 minutes expiry)
              setCookie("accessToken", result.data.accessToken, 0.01);
              
              // Fetch user data after token refresh
              try {
                const validateResponse = await fetch(`${serverUrl}/auth/validate-token`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${result.data.accessToken}`,
                  },
                  credentials: "include",
                });
                if (validateResponse.ok) {
                  const validateResult = await validateResponse.json();
                  if (validateResult.data) {
                    useUserStore.getState().setUserData(validateResult.data);
                  }
                }
              } catch (error) {
                console.error("Error fetching user data after refresh:", error);
              }
              
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }

      // If refreshToken is invalid or doesn't exist, redirect to sign-in
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    validateAndRefreshToken();
  }, []);

  if (isLoading) {
    // Show loading state while checking tokens
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

// Auth Route component that redirects authenticated users away from auth pages
export function AuthRoute({ children }: { children: React.ReactElement }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const accessToken = getCookie("accessToken");
      const refreshToken = getCookie("refreshToken");

      // If no tokens at all, allow access to auth pages
      if (!accessToken && !refreshToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // If accessToken exists, validate it
      if (accessToken) {
        try {
          const serverUrl = getServerUrl();
          const response = await fetch(`${serverUrl}/auth/validate-token`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          });

          if (response.ok) {
            // User is authenticated, get user data
            const result = await response.json();
            if (result.data) {
              useUserStore.getState().setUserData(result.data);
            }
            // User is authenticated, redirect to home
            setIsAuthenticated(true);
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
          const serverUrl = getServerUrl();
          const response = await fetch(`${serverUrl}/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data?.accessToken) {
              // Save new access token (15 minutes expiry)
              setCookie("accessToken", result.data.accessToken, 0.01);
              // User is authenticated, redirect to home
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }

      // If tokens are invalid, allow access to auth pages
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    // Show loading state while checking tokens
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to home page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, allow access to auth pages
  return children;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
          }
          >
            <Route index element={<HomePage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="reels" element={<ReelsPage />} />
            <Route path="reels/:videoId" element={<ReelsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="@:username" element={<ProfilePage />} />
            <Route path=":username" element={<ProfilePage />} />
          </Route>
          <Route
            path="/sign-up"
            element={
              <AuthRoute>
                <SignUpPage />
              </AuthRoute>
            }
          />
          <Route
            path="/sign-in"
            element={
              <AuthRoute>
                <SignInPage />
              </AuthRoute>
            }
          />
          <Route
            path="/stories/:username/:storyId"
            element={
              <ProtectedRoute>
                <StoriesPage />
              </ProtectedRoute>
            }
          />
      </Routes>
    </BrowserRouter>
    <Toaster />
    </ThemeProvider>
  </StrictMode>
);
