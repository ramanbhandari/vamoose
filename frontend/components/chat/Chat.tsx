"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Collapse,
  Grow,
  CircularProgress,
} from "@mui/material";

import Message from "@mui/icons-material/Message";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import MenuIcon from "@mui/icons-material/Menu";
import { useTripStore } from "@/stores/trip-store";
import { useUserStore } from "@/stores/user-store";
import { useMessageStore } from "@/stores/message-store";
import { format } from "date-fns";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tripTabOpen, setTripTabOpen] = useState(false);

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
  const { userTrips, fetchUserTrips } = useTripStore();
  const { user } = useUserStore();
  const {
    messages,
    loading,
    error,
    initializeSocket,
    disconnectSocket,
    joinTripChat,
    leaveTripChat,
    sendMessage,
    fetchMessages,
    initializeSocketListeners,
    cleanupSocketListeners,
  } = useMessageStore();

  const [messageText, setMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (isOpen) {
      initializeSocket();
      initializeSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
      disconnectSocket();
    };
  }, [
    isOpen,
    initializeSocket,
    disconnectSocket,
    initializeSocketListeners,
    cleanupSocketListeners,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user trips
  useEffect(() => {
    if (user) fetchUserTrips(user.id);
  }, [user, fetchUserTrips]);

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

  if (!user) return null;

  const toggleChat = () => setIsOpen((prev) => !prev);
  const toggleMaximize = () => setIsMaximized((prev) => !prev);
  const toggleTripTab = () => setTripTabOpen((prev) => !prev);
  const selectTrip = (trip: { id: number; name?: string }) => {
    setSelectedTrip(trip);
  };

  // New message sending handler
  const handleSend = async () => {
    if (messageText.trim() && selectedTrip && user?.id) {
      try {
        await sendMessage(selectedTrip.id.toString(), user.id, messageText);
        setMessageText("");
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };

  // When maximized, position from the right (instead of from left)
  const chatContainerStyle = isMaximized
    ? { top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
    : {
        bottom: 80,
        width: { xs: "90%", sm: "80%", md: "60%" },
        maxWidth: 550,
        height: 650,
      };

  const tripTabWidth = isMaximized
    ? maximizedTripTabWidth
    : MINIMIZED_TAB_WIDTH;

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
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        <Message fontSize="medium" />
      </IconButton>

      {isOpen && (
        <Box
          sx={{
            position: "fixed",
            right: 20,
            backgroundColor: "var(--background)",
            borderRadius: 2,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            transition: "0.2s ease-in-out",
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
            {!isMaximized && (
              <IconButton onClick={toggleTripTab} sx={{ color: "#fff" }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              color="#fff"
              sx={{ flex: 1, textAlign: "center", mx: 2 }}
            >
              {selectedTrip?.name || "Select a Trip"}
            </Typography>
            <IconButton onClick={toggleMaximize} sx={{ color: "#fff" }}>
              {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton onClick={toggleChat} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Paper>

          <Box sx={{ display: "flex", flex: 1 }}>
            <Collapse in={isMaximized || tripTabOpen} orientation="horizontal">
              <Box
                sx={{
                  width: tripTabWidth,
                  height: "100%",
                  backgroundColor: "var(--background-paper)",
                  overflowY: "auto",
                  borderRight: "1px solid var(--divider)",
                  position: "relative",
                  p: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    m: 2,
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
                        }}
                        onClick={() => selectTrip(trip)}
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
                    ? "url('dark-mode.jpg')"
                    : "url('light-mode.jpg')",
                backgroundRepeat: "repeat",
                backgroundSize: "auto",
                backgroundPosition: "center",
              }}
            >
              {/* Message Container */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 80, // reserve space for input area
                  overflowY: "auto",
                  overscrollBehavior: "contain", // prevents scroll chaining to the window
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
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
                  messages.map((msg) => (
                    <Grow
                      in={true}
                      style={{ transformOrigin: "0 0 0" }}
                      timeout={500}
                      key={msg.messageId}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignSelf:
                            msg.userId === user.id ? "flex-end" : "flex-start",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              msg.userId === user.id ? "grey.500" : "grey.600",
                          }}
                        >
                          {msg.userName || msg.userId === user.id
                            ? "You"
                            : "User"}{" "}
                          • {formatTimestamp(msg.createdAt)}
                        </Typography>
                        <Box
                          sx={{
                            width: "100%",
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
                          }}
                        >
                          <Typography variant="body1">{msg.text}</Typography>
                        </Box>
                      </Box>
                    </Grow>
                  ))
                )}
                {/* Dummy element to scroll into view */}
                <Box ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  backgroundImage: (theme) =>
                    theme.palette.mode === "dark"
                      ? "url('dark-mode.jpg')"
                      : "url('light-mode.jpg')",
                  backgroundRepeat: "repeat",
                  backgroundSize: "auto",
                  backgroundPosition: "center",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMaximized ? "center" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--background-paper)",
                    borderRadius: 50,
                    p: 1.5,
                    pr: 4,
                    mb: 2,
                    width: isMaximized ? "60%" : "100%",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <TextField
                    variant="outlined"
                    placeholder={
                      selectedTrip
                        ? "Type your message..."
                        : "Select a trip to start chatting"
                    }
                    fullWidth
                    size="small"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={!selectedTrip}
                    sx={{
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      width: "100%",
                      borderRadius: 50,
                      padding: "10px 12px",
                      fontSize: "1rem",
                      "& .MuiInputBase-root": { padding: 0 },
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiInputBase-input": {
                        fontSize: "1rem",
                        lineHeight: "1.5",
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!selectedTrip || !messageText.trim()}
                    sx={{
                      ml: 2,
                      backgroundColor: "var(--primary)",
                      borderRadius: 50,
                      padding: "8px 20px",
                      height: "fit-content",
                      "&:hover": {
                        backgroundColor: "var(--primary-hover)",
                      },
                    }}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
