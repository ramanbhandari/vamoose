"use client";

/**
 * @file Navbar.tsx
 * 
 * @description
 * This component renders the top navigation bar for the application. It includes:
 * - The application logo and title (Vamoose!) which redirects to the dashboard.
 * - A theme toggle button for switching between light and dark modes.
 * - A notification bell icon that shows user notifications.
 * - A user profile menu (displaying the user's avatar and name), with options to:
 *   - Manage the user account.
 *   - Navigate to the dashboard.
 *   - Logout the user, with loading state indication while logging out.
 * 
 * The component uses Zustand stores for user authentication state and notifications. 
 * The Supabase auth client is used for handling user login and logout, and real-time 
 * authentication state changes are tracked via the `onAuthStateChange` listener.
 * 
 * The navbar is styled with Material UI components and offers a responsive, interactive 
 * experience for authenticated users.
 */

import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { DashboardTwoTone, LogoutTwoTone } from "@mui/icons-material";
import ThemeToggle from "../ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { usePathname, useRouter } from "next/navigation";
import AnimatedMenuIcon from "./hamAnimIcon";
import { useNotificationStore } from "@/stores/notification-store";

import { useUserNotificationsStore } from "@/stores/user-notifications-store";
import NotificationsBell from "./NotificationsBell";

export default function Navbar() {
  const { user, loading, logoutUser, setUser } = useUserStore();
  const { setNotification } = useNotificationStore();
  const { fetchNotifications } = useUserNotificationsStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Fetch user on initial mount and set the user state if authenticated
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser(); // Call once on mount

    // Listen for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Cleanup the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // if we have a user, fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logoutUser();
    setNotification("Successfully Logged out!", "success");
    router.replace("/login");
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <AppBar position="fixed" sx={{ bgcolor: "primary.main" }}>
      <Toolbar className="flex justify-between items-center px-4">
        <Typography
          variant="h4"
          sx={{
            color: "#ffffff",
            fontFamily: "var(--font-brand)",
          }}
          onClick={() => {
            if (!isLoginPage) {
              router.prefetch("/dashboard");
              router.push("/dashboard");
            }
          }}
        >
          <Link href="/"> {!isLoginPage ? "Vamoose!" : " "}</Link>
        </Typography>

        <Box className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationsBell />}
          {user && (
            <div>
              <IconButton
                aria-label="menu"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <AnimatedMenuIcon isOpen={open} onClick={handleMenuOpen} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: "8px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                    minWidth: "180px",
                    padding: "8px 0",
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    router.push("/account");
                    handleMenuClose();
                  }}
                  sx={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "secondary.main",
                      width: 36,
                      height: 36,
                      mr: 1,
                    }}
                  >
                    {avatarLetter}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {displayName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "gray" }}>
                      Manage Account
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    router.push("/dashboard");
                    handleMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <DashboardTwoTone />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout} disabled={loading}>
                  <ListItemIcon>
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <LogoutTwoTone />
                    )}
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </div>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
