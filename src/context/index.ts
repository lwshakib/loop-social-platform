import { User } from "@/types";
import { create } from "zustand";

interface socialStore {
  user: User | null;
  setUser: (user: User) => void;
}

export const useSocialStore = create<socialStore>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
}));
