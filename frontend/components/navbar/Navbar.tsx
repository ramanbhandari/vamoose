"use client";

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
} from "@mui/material";
import { LogoutTwoTone } from "@mui/icons-material";
import ThemeToggle from "../ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { usePathname, useRouter } from "next/navigation";
import AnimatedMenuIcon from "./hamAnimIcon";
import { useNotificationStore } from "@/stores/notification-store";
export default function Navbar() {
  const { user, loading, logoutUser, setUser } = useUserStore();
  const { setNotification } = useNotificationStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  // Check if it's the login page
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
                  },
                }}
              >
                {user && (
                  <MenuItem onClick={handleMenuClose}>
                    <Link href="/dashboard">Dashboard</Link>
                  </MenuItem>
                )}
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
