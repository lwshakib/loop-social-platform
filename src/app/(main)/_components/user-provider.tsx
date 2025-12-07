"use client";

import { useEffect } from "react";
import { useSocialStore } from "@/context";
import { User } from "@/types";

interface UserProviderProps {
  user: User | null;
}

export function UserProvider({ user }: UserProviderProps) {
  const setUser = useSocialStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return null;
}
