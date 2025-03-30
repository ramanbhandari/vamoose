"use client";

/**
 * @file ChatMessages.tsx
 *
 * @description
 * The main scrollable area that lists messages, handles date dividers,
 * reactions, and the reaction picker popover.
 */

import React, { RefObject } from "react";
import {
  Box,
  CircularProgress,
  Grow,
  IconButton,
  Typography,
} from "@mui/material";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

import DateDivider from "./DateDivider";

interface ChatMessage {
  messageId: string;
  createdAt: string | Date;
  userId: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
}

interface User {
  id?: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  selectedTrip: { id: number; name?: string } | null;
  user: User | null;
  openReactionPickerFor: string | null;
  setOpenReactionPickerFor: React.Dispatch<React.SetStateAction<string | null>>;
  reactionPickerRef: RefObject<HTMLDivElement | null>;
  reactionButtonRef: RefObject<HTMLButtonElement | null>;
  REACTION_EMOJIS: string[];
  processingReactions: { [key: string]: boolean };
  handleReaction: (messageId: string, emoji: string) => Promise<void>;
  isReactionProcessing: (messageId: string, emoji: string) => boolean;
  hasUserReacted: (
    reactions?: { [emoji: string]: string[] },
    emoji?: string
  ) => boolean;
  getUserFullName: (userId: string) => string;
  shouldShowDateDivider: (
    currentMsg: ChatMessage,
    previousMsg: ChatMessage | null
  ) => boolean;
  formatTimestamp: (timestamp: Date | string) => string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  inputAreaHeight: number;
}

export default function ChatMessages({
  messages,
  loading,
  error,
  selectedTrip,
  user,
  openReactionPickerFor,
  setOpenReactionPickerFor,
  reactionPickerRef,
  reactionButtonRef,
  REACTION_EMOJIS,
  handleReaction,
  isReactionProcessing,
  hasUserReacted,
  getUserFullName,
  shouldShowDateDivider,
  formatTimestamp,
  messagesEndRef,
  inputAreaHeight,
}: ChatMessagesProps) {
  if (loading) {
    return (
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
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
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
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
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
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontStyle: "italic", color: "var(--secondary)" }}>
          {selectedTrip
            ? "No messages yet. Start the conversation!"
            : "Select a trip to view messages"}
        </Typography>
      </Box>
    );
  }

  return (
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
        transform: selectedTrip ? "translateY(0)" : "translateY(10px)",
        // Thin scrollbar styling
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
      {messages.map((msg, index) => (
        <React.Fragment key={msg.messageId}>
          {shouldShowDateDivider(
            msg,
            index > 0 ? messages[index - 1] : null
          ) && <DateDivider date={new Date(msg.createdAt)} />}

          <Grow in={true} style={{ transformOrigin: "0 0 0" }} timeout={500}>
            <Box
              sx={{
                maxWidth: "75%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignSelf: msg.userId === user?.id ? "flex-end" : "flex-start",
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
                    user?.id === msg.userId ? "flex-end" : "flex-start",
                  color: msg.userId === user?.id ? "grey.500" : "grey.600",
                }}
              >
                {getUserFullName(msg.userId)}• {formatTimestamp(msg.createdAt)}
              </Typography>
              <Box
                sx={{
                  maxWidth: "100%",
                  whiteSpace: "normal",
                  display: "inline-block",
                  backgroundColor:
                    msg.userId === user?.id
                      ? "var(--primary-hover)"
                      : "var(--background-paper)",
                  color:
                    msg.userId === user?.id ? "var(--chat)" : "var(--text)",
                  padding: "10px 16px",
                  borderRadius:
                    msg.userId === user?.id
                      ? "16px 16px 0 16px"
                      : "16px 16px 16px 0",
                  alignSelf:
                    msg.userId === user?.id ? "flex-end" : "flex-start",
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
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    mt: 0.5,
                    alignSelf:
                      msg.userId === user?.id ? "flex-end" : "flex-start",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <Box
                      key={emoji}
                      onClick={() => handleReaction(msg.messageId, emoji)}
                      sx={{
                        backgroundColor: hasUserReacted(msg.reactions, emoji)
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
                          backgroundColor: "var(--secondary-hover)",
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
                          [msg.userId === user?.id ? "right" : "left"]: 0,
                          backgroundColor: "var(--background-paper)",
                          color: "var(--text)",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
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
                            [msg.userId === user?.id ? "right" : "left"]:
                              "10px",
                            border: "8px solid transparent",
                            borderTopColor: "var(--background-paper)",
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
                          {users.map((uId) => getUserFullName(uId)).join(", ")}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
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
                  right: msg.userId === user?.id ? -12 : "auto",
                  left: msg.userId === user?.id ? "auto" : -12,
                  backgroundColor: "var(--primary)",
                  color: "white",
                  zIndex: 2,
                  width: 24,
                  height: 24,
                  transition: "transform 0.2s ease, background-color 0.2s ease",
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
                    right: msg.userId === user?.id ? 0 : "auto",
                    left: msg.userId === user?.id ? "auto" : 0,
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
                      onClick={() => handleReaction(msg.messageId, emoji)}
                      disabled={isReactionProcessing(msg.messageId, emoji)}
                      sx={{
                        zIndex: 100,
                        padding: "4px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: hasUserReacted(msg.reactions, emoji)
                          ? "var(--primary-light)"
                          : "transparent",
                        opacity: isReactionProcessing(msg.messageId, emoji)
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
                      {isReactionProcessing(msg.messageId, emoji) ? (
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
      ))}
      {/* Dummy element to scroll into view */}
      <Box ref={messagesEndRef} />
    </Box>
  );
}
