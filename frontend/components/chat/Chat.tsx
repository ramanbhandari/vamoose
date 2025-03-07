"use client";
import React, { useState, useEffect } from "react";
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
  SxProps,
  Theme,
} from "@mui/material";

import Forum from "@mui/icons-material/Forum";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useTripStore } from "@/stores/trip-store";
import { useUserStore } from "@/stores/user-store";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTripListOpen, setIsTripListOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState("Group Chat"); // Default chat title

  const { userTrips, fetchUserTrips } = useTripStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchUserTrips(user.id);
    }
  }, [user, fetchUserTrips]);

  if (!user) return null; // Restrict chat access to logged-in users

  const toggleChat = () => setIsOpen((prev) => !prev);
  const toggleTripList = () => setIsTripListOpen((prev) => !prev);
  const toggleMaximize = () => setIsMaximized((prev) => !prev);
  const selectTrip = (trip: { name?: string }) => {
    setSelectedTrip(trip?.name || "Unnamed Trip");
  };

  const baseStyles: SxProps<Theme> = {
    position: "fixed",
    right: 20,
    backgroundColor: "var(--background)",
    borderRadius: 2,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9999,
  };

  const containerStyles: SxProps<Theme> = isMaximized
    ? {
        ...baseStyles,
        bottom: 80,
        width: { xs: "90%", sm: "80%", md: "60%" },
        height: { xs: "80%", sm: "70%", md: "70%" },
        maxWidth: 500,
        maxHeight: 700,
      }
    : {
        ...baseStyles,
        bottom: 80,
        width: { xs: "90%", sm: "80%", md: "60%" },
        maxWidth: 350,
        height: 450,
      };

  return (
    <>
      {/* Floating Chat Icon */}
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
        <Forum fontSize="medium" />
      </IconButton>

      {/* Chat Popup */}
      {isOpen && (
        <Box sx={containerStyles}>
          {/* Chat Header */}
          <Paper
            sx={{
              p: 1,
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <IconButton onClick={toggleTripList} sx={{ color: "#fff" }}>
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              color="#fff"
              sx={{
                flex: 1,
                textAlign: "center",
                whiteSpace: "wrap",
                overflow: "auto",
                //textOverflow: "ellipsis",
                mx: 2,
                maxWidth: "calc(100% - 100px)", 
              }}
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
            <Collapse in={isTripListOpen} orientation="horizontal">
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "var(--background-paper)",
                  overflowY: "auto",
                  borderRight: "1px solid var(--divider)",
                  transition: "width 0.3s", 
                }}
              >
                <Typography variant="body2" sx={{ p: 2, fontWeight: "bold" }}>
                  Trips
                </Typography>

                <List>
                  {userTrips.length > 0 ? (
                    userTrips.map((trip) => (
                      <ListItem
                        key={trip.id}
                        disablePadding
                        sx={{
                          pl: 2,
                          cursor: "pointer",
                          transition: "background-color 0.3s ease",
                          borderRadius: "4px",
                          "&:hover": {
                            backgroundColor: "var(--secondary-hover)",
                          },
                          backgroundColor:
                            selectedTrip === trip.name
                              ? "var(--secondary)"
                              : "transparent",
                          color:
                            selectedTrip === trip.name ? "black" : "inherit",
                        }}
                        onClick={() => selectTrip(trip)}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                whiteSpace: "wrap",
                                overflow: "auto",
                                textOverflow: "ellipsis",
                                maxWidth: "100px",
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
                      sx={{ textAlign: "center", p: 2, fontStyle: "italic" }}
                    >
                      No trips found.
                    </Typography>
                  )}
                </List>
              </Box>
            </Collapse>

            {/* Chat Messages */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  overflowY: "auto",
                  backgroundColor: "var(--background)",
                }}
              >
                <Typography color="var(--text)">
                  Welcome to the chat!
                </Typography>
              </Box>

              {/* Chat Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "var(--background-paper)",
                }}
              >
                <TextField
                  variant="outlined"
                  placeholder="Type your message..."
                  fullWidth
                  size="small"
                  sx={{
                    backgroundColor: "var(--background)",
                    borderRadius: 1,
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    ml: 1,
                    backgroundColor: "var(--primary)",
                    "&:hover": { backgroundColor: "var(--primary-hover)" },
                  }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
