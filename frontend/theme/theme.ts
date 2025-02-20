import { createTheme } from "@mui/material/styles";

const getCSSVariable = (variable: string) =>
  typeof window !== "undefined"
    ? getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
    : "";

export const createAppTheme = () => {
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
