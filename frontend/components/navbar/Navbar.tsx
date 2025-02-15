"use client";

import Link from "next/link";
import { Button, AppBar, Toolbar, Box, Typography } from "@mui/material";
import ThemeToggle from "../ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { logout } from "@/app/dashboard/actions";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  // check if its login page, then we don't want to show the header
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    //fetch on initial mount (eg. on login page), then fetch again if Auth's state changes (eg, logged in, logout)
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    //cleanup  on unmount
    return () => {
      setUser(null); // on unmount set it to null again
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppBar position="fixed" sx={{ bgcolor: "primary.main" }}>
      <Toolbar className="flex justify-between items-center px-4">
        <Typography
          variant="h4"
          sx={{ color: "#ffffff", fontFamily: "var(--font-brand)" }}
        >
          <Link href="/"> {!isLoginPage ? "Vamoose!" : " "}</Link>
        </Typography>

        <Box className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <form action={logout}>
              <Button
                variant="outlined"
                type="submit"
                sx={{
                  color: "primary.main",
                  bgcolor: "#ffffff",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    fontWeight: 900,
                  },
                }}
              >
                Logout
              </Button>
            </form>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
