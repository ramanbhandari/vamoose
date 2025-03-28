"use client";

/**
 * @file Chat.tsx
 * 
 * @description
 * A real-time chat interface for trip groups with features like:
 * - Multiple trip selection
 * - Message reactions
 * - Responsive design for mobile/desktop
 * - Real-time updates via socket connection
 * 
 * Functions:
 * - toggleChat: Toggle chat window visibility with animation
 * - toggleMaximize: Toggle between minimized and maximized chat view
 * - toggleMenu: Toggle trip selection menu visibility
 * - selectTrip: Handle trip selection for chat
 * - handleSend: Send new chat messages
 * - handleInputHeightChange: Adjust layout when input height changes
 * - formatTimestamp: Format message timestamps
 * - handleReaction: Add/remove reactions to messages
 * - isReactionProcessing: Check if a reaction is being processed
 * - hasUserReacted: Check if user has reacted with specific emoji
 * - getUserFullName: Get display name for message sender
 * - shouldShowDateDivider: Determine if date divider should be shown between messages
 * - handleMouseEnter/Leave: Show/hide trip member info on hover
 * 
 */

import React, { useState, useEffect, useRef } from "react";
import { differenceInHours, startOfDay } from "date-fns";

import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Grow,
  CircularProgress,
  useTheme,
} from "@mui/material";

import Message from "@mui/icons-material/Message";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import MenuIcon from "@mui/icons-material/Menu";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useMediaQuery } from "@mui/material";

import { useUserStore } from "@/stores/user-store";
import { useMessageStore } from "@/stores/message-store";
import { format } from "date-fns";
import socketClient from "@/utils/socketClient";
import DateDivider from "./DateDivider";
import ChatInput from "./ChatInput";

interface ChatMessage {
  messageId: string;
  createdAt: string | Date;
  userId: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
}
import { useUserTripsStore } from "@/stores/user-trips-store";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isMaximized, setIsMaximized] = useState(isMobile);
  const [tripTabOpen, setTripTabOpen] = useState(false);
  const [inputAreaHeight, setInputAreaHeight] = useState(115);

  // Add a state to track whether the trips bar is open on mobile
  const [isTripBarOpenOnMobile, setIsTripBarOpenOnMobile] = useState(false);

  // Consolidated menu toggle function that works for both mobile and desktop
  const toggleMenu = () => {
    if (isMobile) {
      setIsTripBarOpenOnMobile((prev) => !prev);
    } else {
      setTripTabOpen((prev) => !prev);
    }
  };

  // Add this state to track which trip's members are being shown on hover
  const [hoveredTrip, setHoveredTrip] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle mouse enter
  const handleMouseEnter = (tripId: number) => {
    if (!isMobile) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredTrip(tripId);
      }, 500);
    }
  };

  // Function to handle mouse leave (clear the timer and hide members)
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTrip(null);
  };

  const MINIMIZED_TAB_WIDTH = 150;
  const MAX_TAB_MIN_WIDTH = 200;
  const MAX_TAB_MAX_WIDTH = 400;

  const [maximizedTripTabWidth, setMaximizedTripTabWidth] =
    useState(MINIMIZED_TAB_WIDTH);

  const [selectedTrip, setSelectedTrip] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { getAllTrips, fetchUserTrips } = useUserTripsStore();
  const { user } = useUserStore();
  // Constant list of reaction emojis.
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  // Track which message's reaction picker is open.
  const [openReactionPickerFor, setOpenReactionPickerFor] = useState<
    string | null
  >(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  const {
    messages,
    loading,
    error,
    initializeSocket,
    joinTripChat,
    leaveTripChat,
    sendMessage,
    fetchMessages,
    initializeSocketListeners,
  } = useMessageStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Track which reactions are currently being processed
  const [processingReactions, setProcessingReactions] = useState<{
    [key: string]: boolean;
  }>({});

  // Handle click outside to close reaction picker
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

  // Initialize socket connection when component mounts
  useEffect(() => {
    // Only initialize and set up the socket if the user is authenticated, saves the unnecessary initilization on login screen
    if (user) {
      initializeSocket();
      initializeSocketListeners();
    }
    // don't disconnect from the socket, just leave the trip chat, we will disconnect socket on logout
    return () => {
      if (user && selectedTrip) {
        leaveTripChat();
      }
    };
  }, [user]);

  useEffect(() => {
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
    // don't make API calls on login screen, only do if user is authenticated
    if (user) fetchTrips();
  }, [fetchUserTrips, getAllTrips]);

  // Get combined trips for chat
  const userTrips = getAllTrips();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Show latest messages when chat is re-opened
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [isOpen]);

  // Handle trip selection
  useEffect(() => {
    if (selectedTrip && selectedTrip.id) {
      // Leave previous trip chat if any
      leaveTripChat();

      // Join new trip chat
      joinTripChat(selectedTrip.id.toString());

      // Fetch messages for the selected trip
      fetchMessages(selectedTrip.id.toString());
    }
  }, [selectedTrip, joinTripChat, leaveTripChat, fetchMessages]);

  // check if trip still exists in user trips
  useEffect(() => {
    const trips = getAllTrips();
    if (selectedTrip && !trips.some((trip) => trip.id === selectedTrip.id)) {
      setSelectedTrip(null);
    }
  }, [userTrips, selectedTrip, getAllTrips]);

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

  // Add effect to handle scrolling when input height changes
  useEffect(() => {
    // Scroll to bottom when input height changes
    const messageContainer = document.querySelector(".message-container");
    if (messageContainer) {
      const isNearBottom =
        messageContainer.scrollHeight -
          messageContainer.scrollTop -
          messageContainer.clientHeight <
        100;

      // If user was already near the bottom, scroll to bottom
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [inputAreaHeight]);

  // Update isMaximized when isMobile changes
  useEffect(() => {
    if (isMobile) {
      setIsMaximized(true);
    }
  }, [isMobile]);

  if (!user) return null;

  //with delay to play chat open/close animation
  const toggleChat = () => {
    if (isOpen) {
      const chatElement = document.querySelector(".chat-container");
      if (chatElement) {
        chatElement.classList.add("closing");
        setTimeout(() => {
          setIsOpen(false);
        }, 200);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(true);
    }
  };
  const toggleMaximize = () => setIsMaximized((prev) => !prev);
  const selectTrip = (trip: { id: number; name?: string }) => {
    setSelectedTrip(trip);
  };

  // Message sending handler
  const handleSend = async (messageText: string) => {
    if (messageText.trim() && selectedTrip && user?.id) {
      try {
        await sendMessage(selectedTrip.id.toString(), user.id, messageText);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  // Handle input area height changes
  const handleInputHeightChange = (height: number) => {
    // Only scroll if height is increasing
    if (height > inputAreaHeight) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    setInputAreaHeight(height);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };

  const chatContainerStyle =
    isMobile || isMaximized
      ? { top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
      : {
          bottom: 80,
          width: { xs: "90%", sm: "80%", md: "60%" },
          maxWidth: 550,
          height: 650,
        };

  const tripTabWidth =
    isMobile || isMaximized ? maximizedTripTabWidth : MINIMIZED_TAB_WIDTH;

  // Handle adding a reaction to a message
  const handleReaction = async (messageId: string, emoji: string) => {
    if (user?.id && selectedTrip) {
      try {
        // Set this reaction as processing
        setProcessingReactions((prev) => ({
          ...prev,
          [`${messageId}-${emoji}`]: true,
        }));

        // Check if the user has already reacted with this emoji
        const hasReacted = hasUserReacted(
          messages.find((m) => m.messageId === messageId)?.reactions,
          emoji
        );

        // Send the reaction to the server
        await socketClient.addReaction(
          messageId,
          user.id,
          emoji,
          selectedTrip.id.toString(),
          hasReacted
        );

        // Close the reaction picker
        setOpenReactionPickerFor(null);
      } catch (error) {
        console.error("Error adding reaction:", error);
      } finally {
        // Clear the processing state
        setProcessingReactions((prev) => {
          const newState = { ...prev };
          delete newState[`${messageId}-${emoji}`];
          return newState;
        });
      }
    }
  };

  // Check if a specific reaction is currently being processed
  const isReactionProcessing = (messageId: string, emoji: string) => {
    return !!processingReactions[`${messageId}-${emoji}`];
  };

  // Check if the current user has reacted with a specific emoji
  const hasUserReacted = (
    reactions?: { [emoji: string]: string[] },
    emoji?: string
  ) => {
    if (!reactions || !emoji || !user?.id) return false;
    return reactions[emoji]?.includes(user.id) || false;
  };

  const getUserFullName = (userId: string) => {
    if (userId === user?.id) return "You";

    const memberNames = userTrips
      .filter((trip) => trip.id === selectedTrip?.id)
      .flatMap((trip) => trip.members || [])
      .filter((member) => member.userId === userId)
      .map((member) => member.user?.fullName)
      .filter(Boolean);

    return memberNames[0] ?? "Unknown User";
  };

  const shouldShowDateDivider = (
    currentMsg: ChatMessage,
    previousMsg: ChatMessage | null
  ): boolean => {
    if (!previousMsg) return true; // Always show for first message

    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);

    // Check the 24hr gap
    return (
      startOfDay(currentDate).getTime() !==
        startOfDay(previousDate).getTime() ||
      differenceInHours(currentDate, previousDate) >= 24
    );
  };

  return (
    <>
      <IconButton
        onClick={toggleChat}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
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
        <Message fontSize="medium" />
      </IconButton>

      {isOpen && (
        <Box
          className="chat-container"
          sx={{
            position: "fixed",
            right: 20,
            backgroundColor: "var(--background)",
            borderRadius: 2,
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
          <Paper
            sx={{
              p: 1,
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <IconButton
              onClick={toggleMenu}
              sx={{
                color: "#fff",
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
              color="#fff"
              sx={{
                flex: 1,
                textAlign: "center",
                mx: 2,
                fontFamily: "var(--font-brand), cursive",
                [theme.breakpoints.down("sm")]: {
                  fontSize: "1.25rem", // Smaller font size for mobile
                },
              }}
            >
              {selectedTrip?.name || "Select a Trip"}
            </Typography>

            {!isMobile && (
              <IconButton onClick={toggleMaximize} sx={{ color: "#fff" }}>
                {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
            <IconButton onClick={toggleChat} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Paper>

          <Box sx={{ display: "flex", flex: 1 }}>
            <Collapse
              in={
                isMobile
                  ? isTripBarOpenOnMobile // On mobile, use isTripBarOpenOnMobile
                  : isMaximized
                    ? true // On non-mobile, keep trips bar open when maximized
                    : tripTabOpen // On non-mobile, use tripTabOpen when not maximized
              }
              orientation="horizontal"
            >
              <Box
                sx={{
                  width: tripTabWidth,
                  height: "100%",
                  backgroundColor: "var(--background-paper)",
                  overflowY: "auto",
                  borderRight: "1px solid var(--divider)",
                  position: "relative",
                  p: 1,
                  [theme.breakpoints.down("sm")]: {
                    width: "100%", // Full width on mobile
                  },
                  // Hide scrollbar
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE/Edge
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    m: 2,
                    textAlign: "center",
                    borderBottom: "1px solid var(--divider)",
                    pb: 1,
                  }}
                >
                  Trips
                </Typography>
                <List sx={{ width: "100%" }}>
                  {userTrips.length > 0 ? (
                    userTrips.map((trip) => (
                      <ListItem
                        key={trip.id}
                        disablePadding
                        sx={{
                          cursor: "pointer",
                          borderRadius: "4px",
                          "&:hover": {
                            backgroundColor: "var(--secondary-hover)",
                            color: "var(--chat)",
                          },
                          backgroundColor:
                            selectedTrip?.id === trip.id
                              ? "var(--secondary)"
                              : "transparent",
                          p: 1,
                          color:
                            selectedTrip?.id === trip.id
                              ? "var(--chat)"
                              : "var(--text)",
                          position: "relative",
                        }}
                        onClick={() => selectTrip(trip)}
                        {...(!isMobile && {
                          onMouseEnter: () => handleMouseEnter(trip.id),
                          onMouseLeave: handleMouseLeave,
                        })}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                width: "100%",
                                fontWeight:
                                  selectedTrip?.id === trip.id
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              {trip.name || "Unnamed Trip"}
                            </Typography>
                          }
                        />
                        {!isMobile && hoveredTrip === trip.id && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "100%", // Position below the trip name
                              left: 0,
                              backgroundColor: "var(--background)",
                              border: "1px solid var(--divider)",
                              borderRadius: "4px",
                              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                              zIndex: 1000,
                              p: 1,
                              mt: 1,
                              minWidth: "100%",
                              color: "var(--text)",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold", mb: 1 }}
                            >
                              Members
                            </Typography>
                            <List sx={{ p: 0 }}>
                              {trip.members?.map((member) => (
                                <ListItem key={member.userId} sx={{ py: 0.5 }}>
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2">
                                        {member.user?.fullName ||
                                          "Unknown User"}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </ListItem>
                    ))
                  ) : (
                    <Typography
                      sx={{
                        textAlign: "center",
                        fontStyle: "italic",
                        width: "100%",
                        p: 2,
                      }}
                    >
                      No trips found.
                    </Typography>
                  )}
                </List>

                {isMaximized && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "2px",
                      height: "100%",
                      cursor: "ew-resize",
                      backgroundColor: "transparent",
                    }}
                    onMouseDown={() => {
                      if (!isMaximized) return;
                      setIsDragging(true);
                    }}
                  />
                )}
              </Box>
            </Collapse>

            {/* Chat Area */}
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
              {/* Message Container */}
              <Box
                className="message-container"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: inputAreaHeight,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  transition: "all 0.3s ease",
                  opacity: selectedTrip ? 1 : 0.7,
                  transform: selectedTrip
                    ? "translateY(0)"
                    : "translateY(10px)",
                  //Thin scrollbar styling
                  "&::-webkit-scrollbar": {
                    width: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(0, 0, 0, 0.2)",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.4)",
                  },
                  scrollbarWidth: "thin",
                  scrollbarColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.3) transparent"
                      : "rgba(0, 0, 0, 0.2) transparent",
                }}
              >
                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Typography color="error">{error}</Typography>
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Typography
                      sx={{ fontStyle: "italic", color: "text.secondary" }}
                    >
                      {selectedTrip
                        ? "No messages yet. Start the conversation!"
                        : "Select a trip to view messages"}
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg, index) => (
                    <React.Fragment key={msg.messageId}>
                      {shouldShowDateDivider(
                        msg,
                        index > 0 ? messages[index - 1] : null
                      ) && <DateDivider date={new Date(msg.createdAt)} />}

                      <Grow
                        in={true}
                        style={{ transformOrigin: "0 0 0" }}
                        timeout={500}
                      >
                        <Box
                          sx={{
                            maxWidth: "75%",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignSelf:
                              msg.userId === user.id
                                ? "flex-end"
                                : "flex-start",
                            gap: 0.5,
                            mb: 4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignSelf:
                                user.id === msg.userId
                                  ? "flex-end"
                                  : "flex-start",
                              color:
                                msg.userId === user.id
                                  ? "grey.500"
                                  : "grey.600",
                            }}
                          >
                            {getUserFullName(msg.userId)}•{" "}
                            {formatTimestamp(msg.createdAt)}
                          </Typography>
                          <Box
                            sx={{
                              maxWidth: "100%",
                              whiteSpace: "normal",
                              display: "inline-block",
                              backgroundColor:
                                msg.userId === user.id
                                  ? "var(--primary-hover)"
                                  : "var(--background-paper)",
                              color:
                                msg.userId === user.id
                                  ? "var(--chat)"
                                  : "var(--text)",
                              padding: "10px 16px",
                              borderRadius:
                                msg.userId === user.id
                                  ? "16px 16px 0 16px"
                                  : "16px 16px 16px 0",
                              alignSelf:
                                msg.userId === user.id
                                  ? "flex-end"
                                  : "flex-start",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                whiteSpace: "pre-line",
                                width: "100%",
                              }}
                            >
                              {msg.text}
                            </Typography>
                          </Box>

                          {/* Display reactions if any */}
                          {msg.reactions &&
                            Object.keys(msg.reactions).length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  mt: 0.5,
                                  alignSelf:
                                    msg.userId === user.id
                                      ? "flex-end"
                                      : "flex-start",
                                  transition: "all 0.2s ease-in-out",
                                }}
                              >
                                {Object.entries(msg.reactions).map(
                                  ([emoji, users]) => {
                                    return (
                                      <Box
                                        key={emoji}
                                        onClick={() =>
                                          handleReaction(msg.messageId, emoji)
                                        }
                                        sx={{
                                          backgroundColor: hasUserReacted(
                                            msg.reactions,
                                            emoji
                                          )
                                            ? "var(--primary-light)"
                                            : "var(--background-paper)",
                                          borderRadius: "12px",
                                          padding: "2px 6px",
                                          fontSize: "0.8rem",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          border: "1px solid var(--divider)",
                                          cursor: "pointer",
                                          position: "relative",
                                          "&:hover": {
                                            backgroundColor:
                                              "var(--secondary-hover)",
                                            transform: "scale(1.05)",
                                            "& .reaction-tooltip": {
                                              opacity: 1,
                                              visibility: "visible",
                                            },
                                          },
                                          transition: "all 0.15s ease-in-out",
                                        }}
                                      >
                                        <span>{emoji}</span>
                                        <span>{users.length}</span>
                                        <Box
                                          className="reaction-tooltip"
                                          sx={{
                                            position: "absolute",
                                            bottom: "calc(100% + 10px)",
                                            [msg.userId === user.id
                                              ? "right"
                                              : "left"]: 0,
                                            backgroundColor:
                                              "var(--background-paper)",
                                            color: "var(--text)",
                                            padding: "6px 10px",
                                            borderRadius: "6px",
                                            boxShadow:
                                              "0 3px 12px rgba(0,0,0,0.15)",
                                            border: "1px solid var(--divider)",
                                            minWidth: "120px",
                                            maxWidth: "220px",
                                            opacity: 0,
                                            visibility: "hidden",
                                            transition: "all 0.2s ease",
                                            transform: "translateY(5px)",
                                            zIndex: 9999,
                                            "&::after": {
                                              content: '""',
                                              position: "absolute",
                                              top: "100%",
                                              [msg.userId === user.id
                                                ? "right"
                                                : "left"]: "10px",
                                              border: "8px solid transparent",
                                              borderTopColor:
                                                "var(--background-paper)",
                                            },
                                            "&:hover": {
                                              transform: "translateY(0)",
                                            },
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontStyle: "italic",
                                              whiteSpace: "normal",
                                              textAlign: "center",
                                              color: "var(--text-secondary)",
                                            }}
                                          >
                                            {users
                                              .map((userId) =>
                                                getUserFullName(userId)
                                              )
                                              .join(", ")}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    );
                                  }
                                )}
                              </Box>
                            )}

                          {/* Reaction button */}
                          <IconButton
                            ref={
                              msg.messageId === openReactionPickerFor
                                ? reactionButtonRef
                                : undefined
                            }
                            onClick={() =>
                              setOpenReactionPickerFor(
                                openReactionPickerFor === msg.messageId
                                  ? null
                                  : msg.messageId
                              )
                            }
                            size="small"
                            sx={{
                              position: "absolute",
                              bottom: -12,
                              right: msg.userId === user.id ? -12 : "auto",
                              left: msg.userId === user.id ? "auto" : -12,
                              backgroundColor: "var(--primary)",
                              color: "white",
                              zIndex: 2,
                              width: 24,
                              height: 24,
                              transition:
                                "transform 0.2s ease, background-color 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                backgroundColor: "var(--primary-hover)",
                              },
                            }}
                          >
                            <EmojiEmotionsIcon fontSize="small" />
                          </IconButton>

                          {/* Reaction picker for this message */}
                          {openReactionPickerFor === msg.messageId && (
                            <Box
                              ref={reactionPickerRef}
                              sx={{
                                position: "absolute",
                                bottom: "30px",
                                right: msg.userId === user.id ? 0 : "auto",
                                left: msg.userId === user.id ? "auto" : 0,
                                backgroundColor: "var(--background-paper)",
                                border: "1px solid var(--divider)",
                                borderRadius: "8px",
                                p: 0.5,
                                display: "flex",
                                gap: 0.5,
                                zIndex: 10,
                                boxShadow: 3,
                                animation: "fadeIn 0.2s ease-in-out",
                                "@keyframes fadeIn": {
                                  "0%": {
                                    opacity: 0,
                                    transform: "translateY(10px)",
                                  },
                                  "100%": {
                                    opacity: 1,
                                    transform: "translateY(0)",
                                  },
                                },
                              }}
                            >
                              {REACTION_EMOJIS.map((emoji, index) => (
                                <IconButton
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(msg.messageId, emoji)
                                  }
                                  disabled={isReactionProcessing(
                                    msg.messageId,
                                    emoji
                                  )}
                                  sx={{
                                    zIndex: 100,
                                    padding: "4px",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    backgroundColor: hasUserReacted(
                                      msg.reactions,
                                      emoji
                                    )
                                      ? "var(--primary-light)"
                                      : "transparent",
                                    opacity: isReactionProcessing(
                                      msg.messageId,
                                      emoji
                                    )
                                      ? 0.5
                                      : 1,
                                    animation: `popIn 0.3s ease-in-out ${index * 0.05}s both`,
                                    "@keyframes popIn": {
                                      "0%": {
                                        transform: "scale(0)",
                                      },
                                      "70%": {
                                        transform: "scale(1.2)",
                                      },
                                      "100%": {
                                        transform: "scale(1)",
                                      },
                                    },
                                    "&:hover": {
                                      transform: "scale(1.2)",
                                      transition: "transform 0.2s ease",
                                    },
                                  }}
                                >
                                  {isReactionProcessing(
                                    msg.messageId,
                                    emoji
                                  ) ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "unset",
                                        fontFamily: "initial",
                                      }}
                                    >
                                      {emoji}
                                    </Typography>
                                  )}
                                </IconButton>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Grow>
                    </React.Fragment>
                  ))
                )}
                {/* Dummy element to scroll into view */}
                <Box ref={messagesEndRef} />
              </Box>

              {/* Chat Input Component */}
              <ChatInput
                selectedTrip={selectedTrip}
                onSendMessage={handleSend}
                onHeightChange={handleInputHeightChange}
                isMaximized={isMaximized}
              />
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
