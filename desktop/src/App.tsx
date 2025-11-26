import { useEffect, useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import ExplorePage from "./pages/ExplorePage";
import HomePage from "./pages/HomePage";
import ReelsPage from "./pages/ReelsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { UserData } from "./store/userStore";
import { checkAuthStatus, signOut } from "./utils/auth";

type Page = "signin" | "signup" | "home" | "explore" | "reels";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("signin");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Check authentication status on app startup
  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);
      const authStatus = await checkAuthStatus();

      if (authStatus.isAuthenticated && authStatus.userData) {
        setIsAuthenticated(true);
        setUserData(authStatus.userData);
        setCurrentPage("home");
      } else {
        setIsAuthenticated(false);
        setUserData(null);
        setCurrentPage("signin");
      }

      setIsLoading(false);
    };

    validateAuth();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleSignIn = (userData: UserData) => {
    setIsAuthenticated(true);
    setUserData(userData);
    setCurrentPage("home");
  };

  const handleSignOut = () => {
    signOut();
    setIsAuthenticated(false);
    setUserData(null);
    setCurrentPage("signin");
  };

  const renderPage = () => {
    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // If not authenticated, show auth pages
    if (!isAuthenticated) {
      switch (currentPage) {
        case "signup":
          return (
            <SignUpPage onNavigate={handleNavigate} onSignIn={handleSignIn} />
          );
        case "signin":
        default:
          return (
            <SignInPage onSignIn={handleSignIn} onNavigate={handleNavigate} />
          );
      }
    }

    // For authenticated users, show the main app with tab navigation
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userData={userData}
          />
        );
      case "explore":
        return (
          <ExplorePage
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userData={userData}
          />
        );
      case "reels":
        return (
          <ReelsPage
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userData={userData}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userData={userData}
          />
        );
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="loop-desktop-theme">
      {renderPage()}
    </ThemeProvider>
  );
}

export default App;
