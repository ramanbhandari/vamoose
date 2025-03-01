"use client";
import { create } from "zustand";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set(() => ({ user })),
  setLoading: (loading) => set({ loading }),

  fetchUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      // if error is of this type, its not an error, just that user isn't logged in
      if (!error.message?.toLowerCase().includes("auth session missing")) {
        console.error("Error fetching user in Zustand store:", error);
      }
    }
    set({ user });
  },
  // set loading true, then reset user state on supabase signout success
  logoutUser: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },
}));
