import { create } from "zustand";
import { persist } from "zustand/middleware";

// User data type
export type UserData = {
  id: string;
  firstName: string;
  surName: string;
  username: string;
  email: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  profileImage?: string;
  coverImage?: string;
  isVerified?: boolean;
  createdAt?: string;
} | null;

interface UserStore {
  userData: UserData;
  setUserData: (data: UserData) => void;
  clearUserData: () => void;
  // Helper functions
  getAvatarUrl: () => string;
  getAvatarFallback: () => string;
}

// Helper function to get dummy avatar URL based on username
const getDummyAvatar = (username: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userData: null,

      setUserData: (data: UserData) => {
        set({ userData: data });
      },

      clearUserData: () => {
        set({ userData: null });
      },

      getAvatarUrl: () => {
        const { userData } = get();
        if (userData?.profileImage) {
          return userData.profileImage;
        }
        if (userData?.username) {
          return getDummyAvatar(userData.username);
        }
        return "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
      },

      getAvatarFallback: () => {
        const { userData } = get();
        if (userData?.firstName && userData?.surName) {
          return `${userData.firstName[0]}${userData.surName[0]}`.toUpperCase();
        }
        if (userData?.username) {
          return userData.username[0].toUpperCase();
        }
        return "U";
      },
    }),
    {
      name: "user-storage", // localStorage key
    }
  )
);
