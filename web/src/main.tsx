import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./index.css";
import HomePage from "./pages/HomePage.tsx";
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import { ThemeProvider } from "@/components/theme-provider"

// Helper function to get cookie value by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

// Protected Route component that checks for accessToken
export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const accessToken = getCookie("accessToken");

  if (!accessToken) {
    return <Navigate to="/sign-in" replace />;
  }

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
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
