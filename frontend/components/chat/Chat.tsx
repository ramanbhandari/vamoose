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
} from "@mui/material";

import Message from "@mui/icons-material/Message";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import MenuIcon from "@mui/icons-material/Menu";
import { useTripStore } from "@/stores/trip-store";
import { useUserStore } from "@/stores/user-store";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tripTabOpen, setTripTabOpen] = useState(false);

  const MINIMIZED_TAB_WIDTH = 150;
  const MAX_TAB_MIN_WIDTH = 200;
  const MAX_TAB_MAX_WIDTH = 400;

  const [maximizedTripTabWidth, setMaximizedTripTabWidth] =
    useState(MINIMIZED_TAB_WIDTH);

  const [selectedTrip, setSelectedTrip] = useState("Group Chat");
  const [isDragging, setIsDragging] = useState(false);
  const { userTrips, fetchUserTrips } = useTripStore();
  const { user } = useUserStore();

  // Initial fake messages for demonstration
  const fakeMessages = [
    {
      id: 1,
      text: "Hello, how can I help you?",
      sender: "received",
      name: "Alice",
    },
    {
      id: 2,
      text: "I have a question about my order. This is a long message to test scrolling.",
      sender: "sent",
      name: "You",
    },
    {
      id: 3,
      text: "Sure, I'd be happy to help!",
      sender: "received",
      name: "Alice",
    },
    {
      id: 4,
      text: "When will my package arrive?",
      sender: "sent",
      name: "You",
    },
    {
      id: 5,
      text: "Hello, how can I help you?",
      sender: "received",
      name: "Alice",
    },
    {
      id: 6,
      text: "I have a question about my order. This is a long message to test scrolling.",
      sender: "sent",
      name: "You",
    },
    {
      id: 7,
      text: "Sure, I'd be happy to help!",
      sender: "received",
      name: "Alice",
    },
    {
      id: 8,
      text: "When will my package arrive?",
      sender: "sent",
      name: "You",
    },
  ];

  // Store messages in state so we can add new ones.
  const [messages, setMessages] = useState(fakeMessages);
  const [messageText, setMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user) fetchUserTrips(user.id);
  }, [user, fetchUserTrips]);

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
  }, [isDragging, isMaximized]);

  if (!user) return null;

  const toggleChat = () => setIsOpen((prev) => !prev);
  const toggleMaximize = () => setIsMaximized((prev) => !prev);
  const toggleTripTab = () => setTripTabOpen((prev) => !prev);
  const selectTrip = (trip: { name?: string }) => {
    setSelectedTrip(trip?.name || "Unnamed Trip");
  };

  // New message sending handler with transition effect.
  const handleSend = () => {
    if (!messageText.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: "sent",
      name: "You",
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");
  };

  // Transition on maximizing chat screen
  const chatContainerStyle = isMaximized
    ? { top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }
    : {
        bottom: 80,
        width: { xs: "90%", sm: "80%", md: "60%" },
        maxWidth: 550,
        height: 650,
      };

  const tripTabWidth = isMaximized ? maximizedTripTabWidth : MINIMIZED_TAB_WIDTH;

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
              {selectedTrip}
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
                            selectedTrip === trip.name
                              ? "var(--secondary)"
                              : "transparent",
                          p: 1,
                          color:
                            selectedTrip === trip.name
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
                                  selectedTrip === trip.name
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
                backgroundColor: "var(--background)",
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
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {messages.map((msg) => (
                  <Grow
                    in={true}
                    style={{ transformOrigin: "0 0 0" }}
                    timeout={500}
                    key={msg.id}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignSelf:
                          msg.sender === "sent" ? "flex-end" : "flex-start",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            msg.sender === "sent" ? "grey.500" : "grey.600",
                        }}
                      >
                        {msg.name}
                      </Typography>
                      <Box
                        sx={{
                          width: "100%",
                          backgroundColor:
                            msg.sender === "sent"
                              ? "var(--primary-hover)"
                              : "var(--background-paper)",
                          color:
                            msg.sender === "sent"
                              ? "var(--chat)"
                              : "var(--text)",
                          padding: "10px 16px",
                          borderRadius:
                            msg.sender === "sent"
                              ? "16px 16px 0 16px"
                              : "16px 16px 16px 0",
                        }}
                      >
                        <Typography variant="body1">{msg.text}</Typography>
                      </Box>
                    </Box>
                  </Grow>
                ))}
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
                  backgroundColor: "var(--background)",
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
                    placeholder="Type your message..."
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
