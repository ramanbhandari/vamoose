"use client";
import React, { useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useRouter } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { user, setUser, fetchUser, logoutUser } = useUserStore();
  const { setNotification } = useNotificationStore();
  const router = useRouter();

  const IDLE_TIMEOUT = 60 * 60 * 1000; // kick them out after 1 hour
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // when client mounts, fetch the user once
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // if the session is null or different user
        if (!session) {
          setUser(null);
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser]);

  // idle session handler
  useEffect(() => {
    // if its here, the session ended or new started so reset the idle timer (new session doesnt necessarily mean login, it can be any activity)
    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      // strat our new timer
      idleTimerRef.current = setTimeout(async () => {
        // if user is logged in, log them out because we have reached idle timeout
        if (user) {
          // show a toast
          setNotification("You were logged out due to inactivity.", "info");
          // actually log out
          await logoutUser();
          router.replace("/login");
        }
      }, IDLE_TIMEOUT);
    };

    const handleUserActivity = () => {
      // user did something, reset the timer
      resetIdleTimer();
    };

    // events to track them
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    // starting first time
    resetIdleTimer();

    return () => {
      // cleanup
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, logoutUser, router, setNotification]);

  return <>{children}</>;
}
