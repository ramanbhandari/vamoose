"use client";

/**
 * @file ChatSidebar.tsx
 *
 * @description
 * The collapsible sidebar showing the list of trips, plus unread badges for each trip.
 */

import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Badge,
  useTheme,
  styled,
  alpha,
} from "@mui/material";
import { TripData } from "@/types";
import { Message } from "@/stores/message-store";
import { formatDistanceToNow } from "date-fns";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -5,
    top: 13,
    padding: "0 4px",
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    minWidth: "20px",
    height: "20px",
    borderRadius: "10px",
    fontSize: "0.75rem",
  },
}));

interface ChatSidebarProps {
  userTrips: TripData[];
  selectedTrip: { id: number; name?: string } | null;
  selectTrip: (trip: { id: number; name?: string }) => void;
  isMaximized: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  tripTabWidth: number;
  unreadCounts: { [tripId: string]: number };
  lastMessages: { [tripId: string]: Message };
}

export default function ChatSidebar({
  userTrips,
  selectedTrip,
  selectTrip,
  isMaximized,
  setIsDragging,
  tripTabWidth,
  unreadCounts,
  lastMessages,
}: ChatSidebarProps) {
  const theme = useTheme();

  const formatTimestamp = (dateString: string | Date) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Box
      sx={{
        width: tripTabWidth,
        height: "100%",
        backgroundColor: "var(--background-paper)",
        borderRight: "1px solid var(--divider)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        [theme.breakpoints.down("sm")]: {
          width: "100%",
        },
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          p: 2,
          fontWeight: "600",
          borderBottom: "1px solid var(--divider)",
          backgroundColor: alpha(theme.palette.background.default, 0.4),
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        Trip Conversations
      </Typography>

      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {userTrips.map((trip) => {
          const tripId = trip.id.toString();
          const unread = unreadCounts[tripId] || 0;
          const lastMessage = lastMessages[tripId];
          const isSelected = selectedTrip?.id === trip.id;

          return (
            // Update the ListItem usage in the ChatSidebar component
            <ListItem
              key={trip.id}
              component="button"
              role="button"
              tabIndex={0}
              onClick={() => selectTrip({ id: trip.id, name: trip.name })}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid var(--divider)",
                backgroundColor: isSelected
                  ? alpha(theme.palette.primary.main, 0.1)
                  : "transparent",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
                // Add cursor pointer for better UX
                cursor: "pointer",
                // Remove default button styling
                border: "none",
                width: "100%",
                textAlign: "left",
                // Add focus states for accessibility
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: "-2px",
                },
              }}
            >
              <Box sx={{ width: "100%", position: "relative" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isSelected ? 600 : unread ? 500 : 400,
                      color: isSelected
                        ? "primary.main"
                        : unread
                          ? "text.primary"
                          : "text.secondary",
                    }}
                  >
                    {trip.name}
                  </Typography>
                  {lastMessage?.createdAt && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isSelected
                          ? "primary.main"
                          : unread
                            ? "text.primary"
                            : "text.disabled",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatTimestamp(lastMessage.createdAt)}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      color: isSelected
                        ? "secondary.main"
                        : unread
                          ? "text.primary"
                          : "text.secondary",
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      pr: 1,
                      fontWeight: unread ? 500 : 400,
                    }}
                  >
                    {lastMessage?.text || ""}
                  </Typography>

                  {unread > 0 && (
                    <StyledBadge
                      badgeContent={unread}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          right: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </ListItem>
          );
        })}
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
            "&:hover": {
              backgroundColor: "primary.main",
            },
          }}
          onMouseDown={() => isMaximized && setIsDragging(true)}
        />
      )}
    </Box>
  );
}
