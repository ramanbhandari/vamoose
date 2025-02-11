"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "@/theme/theme";
import ThemeToggle from "../components/ThemeToggle";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  // the way nextjs works with server and client side, we need to make sure we don't try to render theme before component is mounted on client
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(createAppTheme());

  useEffect(() => {
    setMounted(true);
    const observer = new MutationObserver(() => {
      setTheme(createAppTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeToggle />
      {children}
    </MuiThemeProvider>
  );
}
