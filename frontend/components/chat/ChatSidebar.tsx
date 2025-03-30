"use client";

/**
 * @file ChatSidebar.tsx
 *
 * @description
 * The collapsible sidebar showing the list of trips, plus unread badges for each trip.
 */

import React, { Dispatch, SetStateAction } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Badge,
  useTheme,
} from "@mui/material";
import { TripData } from "@/types";

interface ChatSidebarProps {
  userTrips: TripData[];
  selectedTrip: { id: number; name?: string } | null;
  selectTrip: (trip: { id: number; name?: string }) => void;
  isMaximized: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  tripTabWidth: number;
  unreadCounts: { [tripId: string]: number };
}

export default function ChatSidebar({
  userTrips,
  selectedTrip,
  selectTrip,
  isMaximized,
  setIsDragging,
  tripTabWidth,
  unreadCounts,
}: ChatSidebarProps) {
  const theme = useTheme();

  return (
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
          width: "100%",
        },
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
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
          userTrips.map((trip) => {
            const tripUnread = unreadCounts[trip.id.toString()] || 0;
            return (
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
                onClick={() => selectTrip({ id: trip.id, name: trip.name })}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          width: "100%",
                          fontWeight:
                            selectedTrip?.id === trip.id ? "bold" : "normal",
                        }}
                      >
                        {trip.name}
                      </Typography>
                      {tripUnread > 0 && (
                        <Badge badgeContent={tripUnread} color="error" />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })
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
  );
}
