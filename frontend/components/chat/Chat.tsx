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
} from "@mui/material";
import Forum from "@mui/icons-material/Forum";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import { useTripStore } from "@/stores/trip-store";
import { useUserStore } from "@/stores/user-store";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTripListOpen, setIsTripListOpen] = useState(true);
  const { userTrips, fetchUserTrips, tripData } = useTripStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchUserTrips(user.id);
    }
  }, [user, fetchUserTrips]);

  if (!user) return null; // Restrict chat access to logged-in users

  const toggleChat = () => setIsOpen((prev) => !prev);
  const toggleTripList = () => setIsTripListOpen((prev) => !prev);

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
        <Box
          sx={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 350,
            height: 450,
            backgroundColor: "var(--background)",
            borderRadius: 2,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
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
            {/* Hamburger Menu for Trip List */}
            <IconButton onClick={toggleTripList} sx={{ color: "#fff" }}>
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" color="#fff">
              {tripData?.name || "Group Chat"}
            </Typography>

            <IconButton onClick={toggleChat} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Paper>

          <Box sx={{ display: "flex", flex: 1 }}>
            {/* Trip List Sidebar */}
            <Collapse in={isTripListOpen} orientation="horizontal">
              <Box
                sx={{
                  width: 120,
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
                      <ListItem key={trip.id} disablePadding sx={{ pl: 2 }}>
                        <ListItemText primary={trip.name || "Unnamed Trip"} />
                      </ListItem>
                    ))
                  ) : (
                    <Typography sx={{ textAlign: "center", p: 2 }}>
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
