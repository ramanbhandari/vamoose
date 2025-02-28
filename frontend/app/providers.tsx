"use client";
import React, { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    // when client mounts, fetch the user once
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
