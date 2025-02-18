"use client";

import Link from "next/link";
import { AppBar, Toolbar, Box, Typography, Menu, MenuItem, IconButton, ListItemIcon } from "@mui/material";
import {LogoutTwoTone} from "@mui/icons-material";
import ThemeToggle from "../ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { logout } from "@/app/dashboard/actions";
import { usePathname, useRouter } from "next/navigation";
import AnimatedMenuIcon from "../util/hamAnim";

export default function Navbar() {
  const [user, setUser ] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  // Check if it's the login page
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Fetch user on initial mount and set the user state if authenticated
    const fetchUser  = async () => {
      const { data } = await supabase.auth.getUser ();
      setUser (data.user);
    };

    fetchUser (); // Call once on mount

    // Listen for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser (session.user);
      } else {
        setUser (null);
        // Redirect to login page after logout
        if (!isLoginPage) {
          router.push("/login");
        }
      }
    });

    // Cleanup the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, isLoginPage]); // Add router and isLoginPage to dependencies

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    setUser (null);
  };

  return (
    <AppBar position="fixed" sx={{ bgcolor: "primary.main" }}>
      <Toolbar className="flex justify-between items-center px-4">
        <Typography variant="h4" sx={{ color: "#ffffff", fontFamily: "var(--font-brand)" }}>
          <Link href="/"> {!isLoginPage ? "Vamoose!" : " "}</Link>
        </Typography>

        <Box className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <div>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={handleMenuOpen}
              >
                <AnimatedMenuIcon isOpen={open} onClick={handleMenuOpen} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
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
                <MenuItem onClick={() => {
                  handleMenuClose();
                  handleLogout();
                }}>
                <ListItemIcon>
                <LogoutTwoTone/>
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