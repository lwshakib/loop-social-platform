// Simple user store using React Context (without Zustand for simplicity)
// This will be managed in the App component

export type UserData = {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  surName?: string;
  profileImage?: string;
  bio?: string;
  followers?: number;
  following?: number;
  posts?: number;
};

export const getAvatarUrl = (userData: UserData | null): string => {
  if (userData?.profileImage) {
    return userData.profileImage;
  }
  // Default avatar using DiceBear API
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.username || 'default'}`;
};

export const getAvatarFallback = (userData: UserData | null): string => {
  if (userData?.firstName && userData?.surName) {
    return `${userData.firstName[0]}${userData.surName[0]}`.toUpperCase();
  }
  if (userData?.username) {
    return userData.username.substring(0, 2).toUpperCase();
  }
  return "US";
};

