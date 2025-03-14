import React, { useState, useRef, useEffect } from "react";
import { Box, TextField, Button, IconButton, Typography } from "@mui/material";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SendIcon from "@mui/icons-material/Send";
import EmojiPicker, {
  EmojiClickData,
  Theme as EmojiTheme,
} from "emoji-picker-react";
import { useTheme } from "@mui/material/styles";

interface ChatInputProps {
  selectedTrip: { id: number; name?: string } | null;
  onSendMessage: (text: string) => void;
  onHeightChange: (height: number) => void;
  isMaximized: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  selectedTrip,
  onSendMessage,
  onHeightChange,
  isMaximized,
}) => {
  const theme = useTheme();
  const currentEmojiTheme =
    theme.palette.mode === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT;

  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Handle sending messages
  const handleSend = () => {
    if (messageText.trim() && selectedTrip) {
      onSendMessage(messageText);
      setMessageText("");
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Update parent component with height changes
  useEffect(() => {
    const updateHeight = () => {
      if (inputAreaRef.current) {
        const newHeight = inputAreaRef.current.clientHeight;
        // Only notify parent if height actually changed
        if (Math.abs(newHeight - lastHeightRef.current) > 1) {
          lastHeightRef.current = newHeight;
          onHeightChange(newHeight);
        }
      }
    };

    // Update immediately
    updateHeight();

    // Also set up a small delay to catch any post-render adjustments
    const timeoutId = setTimeout(updateHeight, 50);

    // Set up a resize observer to detect height changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (inputAreaRef.current) {
      resizeObserver.observe(inputAreaRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [messageText, showEmojiPicker, onHeightChange]);

  return (
    <Box
      ref={inputAreaRef}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: 80,
        backdropFilter: "blur(4px)",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(0, 0, 0, 0.1)"
            : "rgba(255, 255, 255, 0.1)",
        p: 2,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: isMaximized ? "center" : "flex-start",
        transition: "all 0.3s ease",
        "@media (max-width: 600px)": {
          p: 1,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: 5,
          p: 1.5,
          pr: 4,
          mb: 2,
          width: isMaximized ? "60%" : "100%",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          position: "relative",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          transition: "all 0.3s ease",
          "@media (max-width: 600px)": {
            width: "100%",
            p: 1,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {!messageText && (
            <Typography
              sx={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: 12,
                color: "text.disabled",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                pointerEvents: "none",
                fontSize: "1rem",
                width: "calc(100% - 24px)",
              }}
            >
              {selectedTrip
                ? "Type your message..."
                : "Select a trip to start chatting"}
            </Typography>
          )}
          <TextField
            variant="outlined"
            placeholder=""
            fullWidth
            multiline
            maxRows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
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
              borderRadius: 20,
              padding: "10px 12px",
              fontSize: "1rem",
              "@media (max-width: 600px)": {
                fontSize: "0.875rem", // Smaller font size on mobile
              },
              "& .MuiInputBase-root": {
                padding: 0,
                alignItems: "center",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .MuiInputBase-inputMultiline": {
                overflow: "auto",
                resize: "none",
                lineHeight: 1.5,
                wordBreak: "break-word",
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
              },
            }}
          />
        </Box>

        {/* Emoji Button */}
        <IconButton
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          disabled={!selectedTrip}
          sx={{
            borderRadius: 3.5,
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: !selectedTrip ? 0.5 : 1,
            transition: "opacity 0.2s ease",
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
            borderRadius: "1em",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            "@media (max-width: 600px)": {
              width: "36px",
              height: "36px",
              padding: "6px",
            },
            "&:hover": { backgroundColor: "var(--primary-hover)" },
          }}
        >
          <SendIcon fontSize="medium" />
        </Button>

        {/* Emoji Picker Pop-up */}
        {showEmojiPicker && (
          <Box
            ref={emojiPickerRef}
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
              "@media (max-width: 600px)": {
                transform: "scale(0.6)", // Smaller emoji picker on mobile
                bottom: "80px",
                ...(isMaximized
                  ? {
                      left: "5%",
                      transformOrigin: "bottom center",
                    }
                  : {
                      left: "1%",
                      transformOrigin: "bottom center",
                    }),
              },
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
  );
};

export default ChatInput;
