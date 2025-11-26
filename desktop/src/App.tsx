import { useEffect, useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { UserData } from "./store/userStore";
import { checkAuthStatus, signOut } from "./utils/auth";

type Page = "signin" | "signup" | "home";

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

    // If authenticated, always show home
    if (isAuthenticated) {
      return (
        <HomePage
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          userData={userData}
        />
      );
    }

    // Otherwise show the requested page
    switch (currentPage) {
      case "signin":
        return (
          <SignInPage onSignIn={handleSignIn} onNavigate={handleNavigate} />
        );
      case "signup":
        return (
          <SignUpPage onNavigate={handleNavigate} onSignIn={handleSignIn} />
        );
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userData={userData}
          />
        );
      default:
        return (
          <SignInPage onSignIn={handleSignIn} onNavigate={handleNavigate} />
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
