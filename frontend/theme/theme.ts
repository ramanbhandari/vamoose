/**
 * @file theme.js
 * @description This file defines the Material-UI theme configuration for the application.
 * It dynamically retrieves CSS variables to apply custom colors, typography, and theme mode (light/dark).
 */

import { createTheme } from "@mui/material/styles";

/**
 * Retrieves the value of a specified CSS variable.
 * 
 * @param {string} variable - The name of the CSS variable.
 * @returns {string} The value of the CSS variable, or an empty string if unavailable.
 */
const getCSSVariable = (variable: string) =>
  typeof window !== "undefined"
    ? getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
    : "";

/**
 * Creates and returns a Material-UI theme based on CSS variables and system preferences.
 * 
 * Determines the current theme mode (light or dark) based on the `data-theme` attribute
 * of the document. Uses CSS variables to set theme colors, with default fallback values.
 */
export const createAppTheme = () => {
  // Determine the theme mode (dark or light) based on the document's data-theme attribute.
  const mode =
    typeof window !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

  return createTheme({
    palette: {
      mode: mode,
      primary: { main: getCSSVariable("--primary") || "#FF5A5F" },
      secondary: { main: getCSSVariable("--secondary") || "#3A4F6C" },
      background: {
        default: getCSSVariable("--background") || "#ffffff",
        paper: getCSSVariable("--background-paper") || "#ffffff",
      },
      text: { primary: getCSSVariable("--text") || "#171717" },
      error: { main: getCSSVariable("--error") || "#e63946" },
    },
    typography: {
      fontFamily: getCSSVariable("--font-general") || "Inter, sans-serif",
    },
  });
};
