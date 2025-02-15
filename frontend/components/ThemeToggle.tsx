"use client";

import { IconButton, useTheme, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      setIsDarkMode(savedTheme === "dark");
    } else if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: "#ffffff",
          "&:hover": { color: theme.palette.secondary.main },
        }}
      >
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
}
