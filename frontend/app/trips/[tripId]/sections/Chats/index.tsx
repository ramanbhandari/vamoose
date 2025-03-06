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
  CssBaseline,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";
import { useTripStore } from "@/stores/trip-store"; // Assuming trip data comes from Zustand or similar store

interface MembersListProps {
  isOpen: boolean;
  toggle: () => void;
  isSmallScreen: boolean;
}

function MembersList({ toggle, isSmallScreen }: MembersListProps) {
  const { tripData } = useTripStore();

  // Process members, ensuring there's a fallback if no data exists
  const processedMembers =
    tripData?.members?.map((member) => ({
      ...member,
    })) || [];

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 250 },
        height: isSmallScreen ? "30vh" : "100%",
        backgroundColor: "var(--background-paper)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid var(--background-paper)",
        }}
      >
        <Typography variant="h6" color="var(--text)">
          Trip Members
        </Typography>
        <IconButton size="small" onClick={toggle}>
          {isSmallScreen ? (
            <KeyboardArrowDownIcon sx={{ color: "var(--text)" }} />
          ) : (
            <ChevronLeftIcon sx={{ color: "var(--text)" }} />
          )}
        </IconButton>
      </Paper>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List>
          {processedMembers.length > 0 ? (
            processedMembers.map((member) => (
              <ListItem key={member.userId} disablePadding sx={{ pl: 2 }}>
                <ListItemText
                  primary={member.user.email}
                  primaryTypographyProps={{
                    color: "var(--text)",
                    textAlign: "justify",
                  }}
                />
              </ListItem>
            ))
          ) : (
            <Typography
              sx={{ textAlign: "center", color: "var(--text)", p: 2 }}
            >
              No members found.
            </Typography>
          )}
        </List>
      </Box>
    </Box>
  );
}

interface ChatWindowProps {
  onMenuClick: () => void;
  showMenuIcon: boolean;
}

function ChatWindow({ onMenuClick, showMenuIcon }: ChatWindowProps) {
  const { tripData } = useTripStore(); // Access tripData from your store

  // Fallback to "Group Chat" if tripData.name is not available
  const tripName = tripData?.name || "Group Chat";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Chat Header */}
      <Paper
        sx={{
          p: 2,
          borderBottom: "1px solid var(--primary)",
          backgroundColor: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: showMenuIcon ? "space-between" : "center",
        }}
        elevation={0}
      >
        {showMenuIcon && (
          <IconButton onClick={onMenuClick} sx={{ color: "#fff" }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          color="#fff"
          sx={{
            transition: "transform 0.3s",
            transform: showMenuIcon ? "translateX(-20px)" : "translateX(0)",
          }}
        >
          {tripName} {/* Display trip name here */}
        </Typography>
        {showMenuIcon && <Box sx={{ width: 40 }} />}
      </Paper>

      {/* Chat Messages Area */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflowY: "auto",
          backgroundColor: "var(--background)",
        }}
      >
        <Typography color="var(--text)">Welcome to the chat!</Typography>
      </Box>

      {/* Chat Input Area */}
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

        <Button
          variant="contained"
          sx={{
            ml: 1,
            backgroundColor: "var(--secondary)",
            "&:hover": { backgroundColor: "var(--secondary-hover)" },
          }}
        >
          😀
        </Button>
      </Box>
    </Box>
  );
}


function ChatUI() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [isMembersOpen, setIsMembersOpen] = useState(!isSmallScreen);

  useEffect(() => {
    setIsMembersOpen(!isSmallScreen);
  }, [isSmallScreen]);

  const toggleMembers = () => setIsMembersOpen((prev) => !prev);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        height: "80vh",
        overflow: "hidden",
        backgroundColor: "var(--background)",
        borderRadius: "1vh",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <CssBaseline />
      <Collapse
        in={isMembersOpen}
        orientation={isSmallScreen ? "vertical" : "horizontal"}
        timeout={300}
        unmountOnExit
      >
        <MembersList
          isOpen={isMembersOpen}
          toggle={toggleMembers}
          isSmallScreen={isSmallScreen}
        />
      </Collapse>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          height: "100%",
        }}
      >
        <ChatWindow onMenuClick={toggleMembers} showMenuIcon={!isMembersOpen} />
      </Box>
    </Box>
  );
}

export default ChatUI;
