"use client";

/**
 * @file Chat.tsx
 *
 * @description
 * Entry point for the chat feature. Renders the floating chat toggle button
 * with an unread badge, and when open, shows the ChatWindow.
 */

import React, { useState } from "react";
import { IconButton, Badge } from "@mui/material";
import Message from "@mui/icons-material/Message";
import { useUserStore } from "@/stores/user-store";
import { useChatNotificationStore } from "@/stores/chat-notification-store";
import ChatWindow from "./ChatWindow";
import { useMessageStore } from "@/stores/message-store";

export default function Chat() {
  const { user } = useUserStore();
  const { getTotalUnreadCount } = useChatNotificationStore();
  const { setChatWindowOpen } = useMessageStore();
  const [isOpen, setIsOpen] = useState(false);

  // If user is not logged in, no chat is rendered
  if (!user) return null;

  const globalUnread = getTotalUnreadCount();

  /**
   * @function toggleChat
   * @description Toggles chat window open/close with animation
   */
  const toggleChat = () => {
    if (isOpen) {
      const chatElement = document.querySelector(".chat-container");
      if (chatElement) {
        chatElement.classList.add("closing");
        setTimeout(() => {
          setChatWindowOpen(false);
          setIsOpen(false);
        }, 200);
      } else {
        setChatWindowOpen(false);
        setIsOpen(false);
      }
    } else {
      setChatWindowOpen(true);
      setIsOpen(true);
    }
  };

  return (
    <>
      <IconButton
        onClick={toggleChat}
        sx={{
          position: "fixed",
          bottom: 25,
          right: 25,
          bgcolor: "primary.main",
          color: "white",
          p: 1.5,
          boxShadow: 3,
          zIndex: 9999,
          "&:hover": {
            bgcolor: "primary.dark",
            transform: "scale(1.1)",
          },
          transition: "transform 0.2s ease, background-color 0.2s ease",
          animation: isOpen
            ? "buttonExpand 0.3s ease forwards"
            : "buttonContract 0.3s ease forwards",
          "@keyframes buttonExpand": {
            "0%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.2)" },
            "100%": { transform: "scale(1)" },
          },
          "@keyframes buttonContract": {
            "0%": { transform: "scale(1)" },
            "100%": { transform: "scale(1)" },
          },
        }}
      >
        <Badge
          badgeContent={globalUnread}
          color="error"
          invisible={globalUnread === 0}
        >
          <Message fontSize="medium" />
        </Badge>
      </IconButton>

      {isOpen && <ChatWindow onClose={toggleChat} />}
    </>
  );
}
