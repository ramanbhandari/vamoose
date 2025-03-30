"use client";

/**
 * @file ChatWindow.tsx
 *
 * @description
 * Holds the entire chat interface once the user opens it:
 * - Main container styling
 * - Sizing / max-min logic
 * - Setting up socket, fetching trips, etc.
 * - Renders ChatHeader, ChatSidebar, ChatMessages, ChatInput
 */

import React, { useState, useEffect, useRef } from "react";
import { Box, Collapse, useTheme, useMediaQuery } from "@mui/material";

import { differenceInHours, startOfDay, format } from "date-fns";

import { useUserStore } from "@/stores/user-store";
import { useMessageStore } from "@/stores/message-store";
import { useUserTripsStore } from "@/stores/user-trips-store";
import { useChatNotificationStore } from "@/stores/chat-notification-store";

import socketClient from "@/utils/socketClient";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";

interface ChatWindowProps {
  onClose: () => void;
}

interface ChatMessage {
  messageId: string;
  createdAt: string | Date;
  userId: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const MINIMIZED_TAB_WIDTH = 280;
  const MAX_TAB_MIN_WIDTH = 200;
  const MAX_TAB_MAX_WIDTH = 400;
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { user } = useUserStore();
  const { getAllTrips, fetchUserTrips } = useUserTripsStore();
  const {
    messages,
    loading,
    error,
    currentTripId,
    currentTripName,
    initializeSocket,
    setActiveTrip,
    sendMessage,
    fetchMessages,
    initializeSocketListeners,
  } = useMessageStore();

  const { joinAllTrips, clearUnreadCount, unreadCounts, lastMessages } =
    useChatNotificationStore();

  const [selectedTrip, setSelectedTrip] = useState<{
    id: number;
    name?: string;
  } | null>({
    id: Number(currentTripId) ?? null,
    name: currentTripName ?? undefined,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [tripTabOpen, setTripTabOpen] = useState(false);
  const [isTripBarOpenOnMobile, setIsTripBarOpenOnMobile] = useState(false);

  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  const [openReactionPickerFor, setOpenReactionPickerFor] = useState<
    string | null
  >(null);
  const [processingReactions, setProcessingReactions] = useState<{
    [key: string]: boolean;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const [isMaximized, setIsMaximized] = useState(isMobile);
  const [inputAreaHeight, setInputAreaHeight] = useState(115);
  const [maximizedTripTabWidth, setMaximizedTripTabWidth] =
    useState(MINIMIZED_TAB_WIDTH);

  // If user is valid, fetch trips, join rooms, set up socket
  useEffect(() => {
    if (!user) return;

    const fetchTrips = async () => {
      const allTrips = getAllTrips();
      if (allTrips.length === 0) {
        await Promise.all([
          fetchUserTrips("current"),
          fetchUserTrips("upcoming"),
          fetchUserTrips("past"),
        ]);
      }
    };

    fetchTrips().then(() => {
      const allTrips = getAllTrips();
      if (allTrips.length > 0) {
        joinAllTrips(allTrips);
      }
    });

    initializeSocket();
    initializeSocketListeners();
  }, [
    user,
    getAllTrips,
    fetchUserTrips,
    joinAllTrips,
    initializeSocket,
    initializeSocketListeners,
  ]);

  // Scroll to bottom when messages increase
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Mark chat as "activeTrip" and fetch messages when a trip is selected
  useEffect(() => {
    if (!selectedTrip?.id) return;
    setActiveTrip(selectedTrip.id.toString(), selectedTrip.name || "");
    fetchMessages(selectedTrip.id.toString());
    clearUnreadCount(selectedTrip.id.toString());
  }, [selectedTrip, setActiveTrip, fetchMessages, clearUnreadCount]);

  // If a trip no longer exists in userTrips, reset selection
  useEffect(() => {
    const all = getAllTrips();
    if (selectedTrip && !all.some((t) => t.id === selectedTrip.id)) {
      setSelectedTrip(null);
    }
  }, [getAllTrips, selectedTrip]);

  // Dragging logic for resizing the trip sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isMaximized) {
        setMaximizedTripTabWidth(
          Math.min(Math.max(e.clientX, MAX_TAB_MIN_WIDTH), MAX_TAB_MAX_WIDTH)
        );
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMaximized, MAX_TAB_MIN_WIDTH, MAX_TAB_MAX_WIDTH]);

  // Scroll down if user was near bottom and input area height changes
  useEffect(() => {
    const messageContainer = document.querySelector(".message-container");
    if (messageContainer) {
      const isNearBottom =
        messageContainer.scrollHeight -
          messageContainer.scrollTop -
          messageContainer.clientHeight <
        100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [inputAreaHeight]);

  // If screen goes mobile, automatically set chat to max
  useEffect(() => {
    if (isMobile) {
      setIsMaximized(true);
    }
  }, [isMobile]);

  // Close reaction picker if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openReactionPickerFor &&
        reactionPickerRef.current &&
        reactionButtonRef.current &&
        !reactionPickerRef.current.contains(event.target as Node) &&
        !reactionButtonRef.current.contains(event.target as Node)
      ) {
        setOpenReactionPickerFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openReactionPickerFor]);

  // If there's no user, do not render the window at all
  if (!user) return null;

  /**
   * @function toggleMaximize
   * @description Toggle between minimized and maximized chat view
   */
  const toggleMaximize = () => setIsMaximized((prev) => !prev);

  /**
   * @function toggleMenu
   * @description Toggle trip selection menu visibility (sidebar)
   */
  const toggleMenu = () => {
    if (isMobile) {
      setIsTripBarOpenOnMobile((prev) => !prev);
    } else {
      setTripTabOpen((prev) => !prev);
    }
  };

  /**
   * @function toggleMenuClose
   * @description Set trip selection menu visibility to false
   */
  const toggleMenuClose = () => {
    if (isMobile) {
      setIsTripBarOpenOnMobile(false);
    } else {
      setTripTabOpen(false);
    }
  };

  /**
   * @function selectTrip
   * @description Sets the currently-selected trip in the chat
   */
  const selectTrip = (trip: { id: number; name?: string }) => {
    setSelectedTrip(trip);
    toggleMenu();
  };

  /**
   * @function handleSend
   * @description Send new chat messages
   */
  const handleSend = async (messageText: string) => {
    if (messageText.trim() && selectedTrip && user?.id) {
      try {
        await sendMessage(selectedTrip.id.toString(), user.id, messageText);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  /**
   * @function handleInputHeightChange
   * @description Adjust layout when input height changes
   */
  const handleInputHeightChange = (height: number) => {
    if (height > inputAreaHeight) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    setInputAreaHeight(height);
  };

  /**
   * @function handleReaction
   * @description Handle adding/removing reaction to a message
   */
  const handleReaction = async (messageId: string, emoji: string) => {
    if (user?.id && selectedTrip) {
      try {
        // Mark reaction as processing
        setProcessingReactions((prev) => ({
          ...prev,
          [`${messageId}-${emoji}`]: true,
        }));

        // Check if user has already reacted with this emoji
        const foundMsg = messages.find((m) => m.messageId === messageId);
        const reactedAlready = hasUserReacted(foundMsg?.reactions, emoji);

        await socketClient.addReaction(
          messageId,
          user.id,
          emoji,
          selectedTrip.id.toString(),
          reactedAlready
        );

        setOpenReactionPickerFor(null);
      } catch (error) {
        console.error("Error adding reaction:", error);
      } finally {
        setProcessingReactions((prev) => {
          const newState = { ...prev };
          delete newState[`${messageId}-${emoji}`];
          return newState;
        });
      }
    }
  };

  /**
   * @function isReactionProcessing
   * @description Check if a specific reaction is in progress
   */
  const isReactionProcessing = (messageId: string, emoji: string) => {
    return !!processingReactions[`${messageId}-${emoji}`];
  };

  /**
   * @function hasUserReacted
   * @description Check if current user has reacted with a particular emoji
   */
  const hasUserReacted = (
    reactions?: { [emoji: string]: string[] },
    emoji?: string
  ) => {
    if (!reactions || !emoji || !user?.id) return false;
    return reactions[emoji]?.includes(user.id) || false;
  };

  /**
   * @function getUserFullName
   * @description Get display name (i.e. "You" or user's full name) for a message sender
   */
  const getUserFullName = (userId: string) => {
    if (userId === user?.id) return "You";
    const allTrips = getAllTrips();
    const memberNames = allTrips
      .filter((trip) => trip.id === selectedTrip?.id)
      .flatMap((trip) => trip.members || [])
      .filter((member) => member.userId === userId)
      .map((member) => member.user?.fullName)
      .filter(Boolean);

    return memberNames[0] ?? "Unknown User";
  };

  /**
   * @function shouldShowDateDivider
   * @description Determine if date divider should be shown between messages
   */
  const shouldShowDateDivider = (
    currentMsg: ChatMessage,
    previousMsg: ChatMessage | null
  ): boolean => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return (
      startOfDay(currentDate).getTime() !==
        startOfDay(previousDate).getTime() ||
      differenceInHours(currentDate, previousDate) >= 24
    );
  };

  /**
   * @function formatTimestamp
   * @description Helper to format message timestamps
   */
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };

  const handleCloseChatWindow = () => {
    onClose();
  };

  const tripTabWidth =
    isMobile || isMaximized ? maximizedTripTabWidth : MINIMIZED_TAB_WIDTH;

  const chatContainerStyle =
    isMobile || isMaximized
      ? { top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
      : {
          bottom: 80,
          width: { xs: "90%", sm: "80%", md: "60%" },
          maxWidth: 550,
          height: 650,
        };

  return (
    <Box
      className="chat-container"
      sx={{
        position: "fixed",
        right: 20,
        backgroundColor: "var(--background)",
        borderRadius: isMaximized ? 0 : 2,
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: 1,
        transform: "translateY(0) scale(1)",
        transformOrigin: "bottom right",
        animation: "chatOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&.closing": {
          opacity: 0,
          transform: "translateY(20px) scale(0.95)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        "@keyframes chatOpen": {
          "0%": {
            opacity: 0,
            transform: "translateY(20px) scale(0.95)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        },
        ...chatContainerStyle,
      }}
    >
      {/* ChatHeader (top bar) */}
      <ChatHeader
        selectedTripName={selectedTrip?.name || "Select a Trip"}
        isMaximized={isMaximized}
        isMobile={isMobile}
        onToggleMenu={toggleMenu}
        onToggleMaximize={toggleMaximize}
        onClose={handleCloseChatWindow}
      />

      {/* Main content: sidebar + messages */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* ChatSidebar */}
        <Collapse
          in={
            isMobile ? isTripBarOpenOnMobile : isMaximized ? true : tripTabOpen
          }
          orientation="horizontal"
        >
          <ChatSidebar
            userTrips={getAllTrips()}
            selectedTrip={selectedTrip}
            selectTrip={selectTrip}
            isMaximized={isMaximized}
            setIsDragging={setIsDragging}
            tripTabWidth={tripTabWidth}
            unreadCounts={unreadCounts}
            lastMessages={lastMessages}
          />
        </Collapse>

        {/* ChatMessages + Input */}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "url('chat_dark-mode.jpg')"
                : "url('chat_light-mode.jpg')",
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            backgroundPosition: "center",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Messages container */}
          <ChatMessages
            messages={messages}
            loading={loading}
            error={error}
            selectedTrip={selectedTrip}
            user={user}
            openReactionPickerFor={openReactionPickerFor}
            setOpenReactionPickerFor={setOpenReactionPickerFor}
            reactionPickerRef={reactionPickerRef}
            reactionButtonRef={reactionButtonRef}
            REACTION_EMOJIS={REACTION_EMOJIS}
            handleReaction={handleReaction}
            isReactionProcessing={isReactionProcessing}
            hasUserReacted={hasUserReacted}
            getUserFullName={getUserFullName}
            shouldShowDateDivider={shouldShowDateDivider}
            formatTimestamp={formatTimestamp}
            messagesEndRef={messagesEndRef}
            inputAreaHeight={inputAreaHeight}
            processingReactions={processingReactions}
          />

          {/* ChatInput at bottom */}
          <ChatInput
            selectedTrip={selectedTrip}
            onSendMessage={handleSend}
            onHeightChange={handleInputHeightChange}
            isMaximized={isMaximized}
            toggleMenuClose={toggleMenuClose}
          />
        </Box>
      </Box>
    </Box>
  );
}
