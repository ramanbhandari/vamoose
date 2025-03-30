"use client";

/**
 * @file ChatHeader.tsx
 *
 * @description
 * The header bar that shows the selected trip name and
 * controls for closing/maximizing the chat window and toggling the sidebar.
 */

import React from "react";
import { Paper, IconButton, Typography, useTheme } from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CloseIcon from "@mui/icons-material/Close";

interface ChatHeaderProps {
  selectedTripName: string;
  isMaximized: boolean;
  isMobile: boolean;
  onToggleMenu: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export default function ChatHeader({
  selectedTripName,
  isMaximized,
  isMobile,
  onToggleMenu,
  onToggleMaximize,
  onClose,
}: ChatHeaderProps) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 1,
        backgroundColor: "var(--background-paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <IconButton
        onClick={onToggleMenu}
        sx={{
          color: "var(--secondary)",
          width: 40,
          height: 40,
          padding: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...(!isMobile && isMaximized && { display: "none" }),
        }}
      >
        <MenuIcon />
      </IconButton>

      <Typography
        variant="h6"
        sx={{
          flex: 1,
          textAlign: "center",
          mx: 2,
          fontFamily: "var(--font-brand), cursive",
          color: "var(--secondary)",
          [theme.breakpoints.down("sm")]: {
            fontSize: "1.25rem",
          },
        }}
      >
        {selectedTripName}
      </Typography>

      {!isMobile && (
        <IconButton
          onClick={onToggleMaximize}
          sx={{ color: "var(--secondary)" }}
        >
          {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      )}
      <IconButton onClick={onClose} sx={{ color: "var(--primary)" }}>
        <CloseIcon />
      </IconButton>
    </Paper>
  );
}
