// Token management utilities for desktop app using localStorage

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'loop_access_token',
  REFRESH_TOKEN: 'loop_refresh_token',
};

// Get server URL from environment variables
export const getServerUrl = (): string => {
  return import.meta.env.VITE_SERVER_URL || "";
};

// Save tokens to localStorage
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
};

// Get access token from localStorage
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

// Get refresh token from localStorage
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

// Clear all tokens from localStorage
export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
};

// Validate access token
export const validateToken = async (accessToken: string): Promise<{ valid: boolean; userData?: any }> => {
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
      const result = await response.json();
      return { valid: true, userData: result.data };
    }
    
    return { valid: false };
  } catch (error) {
    console.error("Token validation failed:", error);
    return { valid: false };
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken: string): Promise<{ success: boolean; accessToken?: string; userData?: any }> => {
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
        // Save new access token
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, result.data.accessToken);
        
        // Try to get user data
        const userData = await validateToken(result.data.accessToken);
        
        return { 
          success: true, 
          accessToken: result.data.accessToken,
          userData: userData.userData 
        };
      }
    }
    
    return { success: false };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return { success: false };
  }
};

// Check authentication status and validate/refresh tokens
export const checkAuthStatus = async (): Promise<{ isAuthenticated: boolean; userData?: any }> => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // If no tokens at all, user is not authenticated
  if (!accessToken && !refreshToken) {
    return { isAuthenticated: false };
  }

  // If access token exists, try to validate it
  if (accessToken) {
    const validation = await validateToken(accessToken);
    if (validation.valid) {
      return { isAuthenticated: true, userData: validation.userData };
    }
  }

  // If access token is invalid or doesn't exist, try to refresh using refresh token
  if (refreshToken) {
    const refreshResult = await refreshAccessToken(refreshToken);
    if (refreshResult.success) {
      return { isAuthenticated: true, userData: refreshResult.userData };
    }
  }

  // If both tokens are invalid, clear them and return not authenticated
  clearTokens();
  return { isAuthenticated: false };
};

// Sign in function
export const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; userData?: any }> => {
  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const result = await response.json();
      
      // Extract tokens from response
      if (result.data?.accessToken && result.data?.refreshToken) {
        // Save tokens to localStorage
        saveTokens(result.data.accessToken, result.data.refreshToken);
        
        // Return user data (excluding tokens)
        const userData = { ...result.data };
        delete userData.accessToken;
        delete userData.refreshToken;
        
        return { success: true, userData };
      }
      
      return { success: false, error: "No tokens received from server" };
    } else {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to sign in. Please try again." };
    }
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
};

// Sign up function
export const signUp = async (userData: {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  gender: string;
  username: string;
  email: string;
  password: string;
  otp?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const result = await response.json();
      
      // If sign up returns tokens, save them
      if (result.data?.accessToken && result.data?.refreshToken) {
        saveTokens(result.data.accessToken, result.data.refreshToken);
      }
      
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to sign up. Please try again." };
    }
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
};

// Sign out function
export const signOut = (): void => {
  clearTokens();
};

