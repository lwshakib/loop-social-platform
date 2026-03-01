import { User } from '@/types';
import { create } from 'zustand';

/**
 * Social Store (Zustand)
 * Maintains global state for the authenticated user across the application.
 */
interface socialStore {
  // Current logged in user object or null if not authenticated
  user: User | null;
  // Function to update the current user in state
  setUser: (user: User) => void;
}

/**
 * useSocialStore Hook
 * Provides reactive access to the user state and update methods.
 */
export const useSocialStore = create<socialStore>((set) => ({
  user: null, // Initial state
  setUser: (user: User) => set({ user }), // Method to update user after login or profile update
}));
