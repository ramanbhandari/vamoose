"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";

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
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import EmojiPicker, {
  EmojiClickData,
  Theme as EmojiTheme,
} from "emoji-picker-react";

import { useTripStore } from "@/stores/trip-store";
import { useUserStore } from "@/stores/user-store";
import { useMessageStore } from "@/stores/message-store";
import { format } from "date-fns";
import socketClient from "@/utils/socketClient";

export default function Chat() {
  const theme = useTheme();
  // Automatically set emoji picker theme based on MUI theme mode
  const currentEmojiTheme =
    theme.palette.mode === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT;

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tripTabOpen, setTripTabOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
  // Constant list of reaction emojis.
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  // Track which message's reaction picker is open.
  const [openReactionPickerFor, setOpenReactionPickerFor] = useState<
    string | null
  >(null);
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
    cleanupSocketListeners,
  } = useMessageStore();

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Track which reactions are currently being processed
  const [processingReactions, setProcessingReactions] = useState<{
    [key: string]: boolean;
  }>({});

  // Initialize socket connection when component mounts
  useEffect(() => {
    initializeSocket();
    initializeSocketListeners();

    return () => {
      cleanupSocketListeners();
      if (selectedTrip) {
        leaveTripChat();
      }
    };
  }, [selectedTrip]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
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

  // Add a useEffect to log messages when they change
  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

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

  // Handler for emoji selection in the input area.
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
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

  // Handle adding a reaction to a message
  const handleReaction = async (messageId: string, emoji: string) => {
    if (user?.id && selectedTrip) {
      try {
        console.log(
          `User ${user.id} reacting with ${emoji} to message ${messageId}`
        );

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

        console.log(`Has user already reacted: ${hasReacted}`);

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
      .filter(trip => trip.id === selectedTrip?.id)
      .flatMap(trip => trip.members || [])
      .filter(member => member.userId === userId)
      .map(member => member.user?.fullName)
      .filter(Boolean);
      
    return memberNames[0] ?? "Unknown User";
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
              sx={{
                flex: 1,
                textAlign: "center",
                mx: 2,
                fontFamily: "var(--font-brand), cursive",
              }}
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
                  overscrollBehavior: "contain",
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
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignSelf:
                            msg.userId === user.id ? "flex-end" : "flex-start",
                          gap: 0.5,
                          mb: 4,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              msg.userId === user.id ? "grey.500" : "grey.600",
                          }}
                        >
                          {getUserFullName(msg.userId)}{" "}
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
                              }}
                            >
                              {Object.entries(msg.reactions).map(
                                ([emoji, users]) => (
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
                                      "&:hover": {
                                        backgroundColor:
                                          "var(--secondary-hover)",
                                      },
                                    }}
                                  >
                                    <span>{emoji}</span>
                                    <span>{users.length}</span>
                                  </Box>
                                )
                              )}
                            </Box>
                          )}

                        {/* Reaction button */}
                        <IconButton
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
                          }}
                        >
                          <EmojiEmotionsIcon fontSize="small" />
                        </IconButton>

                        {/* Reaction picker for this message */}
                        {openReactionPickerFor === msg.messageId && (
                          <Box
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
                            }}
                          >
                            {REACTION_EMOJIS.map((emoji) => (
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
                                  padding: "4px",
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
                                }}
                              >
                                {isReactionProcessing(msg.messageId, emoji) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Typography variant="body2">
                                    {emoji}
                                  </Typography>
                                )}
                              </IconButton>
                            ))}
                          </Box>
                        )}
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
                    position: "relative",
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
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      borderRadius: 50,
                      padding: "10px 12px",
                      fontSize: "1rem",
                      "& .MuiInputBase-root": { padding: 0 },
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                  />

                  {/* Emoji Button */}
                  <IconButton
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    sx={{
                      borderRadius: 3.5,
                      padding: "8px",
                    }}
                  >
                    <EmojiEmotionsIcon />
                  </IconButton>

                  {/* Send Button */}
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!selectedTrip || !messageText.trim()}
                    sx={{
                      ml: 2,
                      backgroundColor: "var(--primary)",
                      borderRadius: 50,
                      padding: "8px 20px",
                      "&:hover": { backgroundColor: "var(--primary-hover)" },
                    }}
                  >
                    Send
                  </Button>

                  {/* Emoji Picker Pop-up */}
                  {showEmojiPicker && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: "80px",
                        zIndex: 1000,
                        ...(isMaximized
                          ? {
                              left: "65%",
                              transform: "translateX(-50%) scale(0.8)",
                              transformOrigin: "bottom center",
                            }
                          : {
                              right: 0,
                              transform: "scale(0.7)",
                              transformOrigin: "bottom center",
                            }),
                        backgroundColor: "var(--background-paper)",
                        color: "var(--text)",
                      }}
                    >
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={currentEmojiTheme}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
