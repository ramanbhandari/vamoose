"use client";

import { Box, Typography, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";

export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // check if its NOT login page, then we don't want to show STICKY footer
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.paper",
        color: "#ffffff",
        py: 1.5,
        textAlign: "center",
        position: isLoginPage ? "sticky" : null,
        bottom: 0,
        width: "100%",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 -2px 8px rgba(255, 255, 255, 0.1)"
            : "0 -2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: theme.palette.mode === "light" ? "#000000" : "#ffffff",
          }}
        >
          © {currentYear} Vamoose! All rights reserved | Developed by{" "}
          <strong>ByteMates</strong>
        </Typography>
      </Container>
    </Box>
  );
}
