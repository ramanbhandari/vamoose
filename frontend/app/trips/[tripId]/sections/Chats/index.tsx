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

const members = [
  "Alice",
  "Bob",
  "Charlie",
  "Frank",
  "Esmeil",
  "Daisy",
  "Edward",
  "Fiona",
  "George",
  "Hannah",
  "Ian",
  "Julia",
];

interface MembersListProps {
  isOpen: boolean;
  toggle: () => void;
  isSmallScreen: boolean;
}

function MembersList({ toggle, isSmallScreen }: MembersListProps) {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 250 },
        // Use a fixed height on small screens to enable scrolling.
        height: isSmallScreen ? "30vh" : "100%",
        borderRight: { xs: "none", md: "1px solid #000000" },
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
      {/* Wrap the list in a container with overflowY to enable scrolling */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List>
          {members.map((member, index) => (
            <ListItem key={index} disablePadding sx={{ pl: 2 }}>
              <ListItemText
                primary={member}
                primaryTypographyProps={{
                  color: "var(--text)",
                  textAlign: "justify",
                }}
              />
            </ListItem>
          ))}
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
          Group Chat
        </Typography>
        {showMenuIcon && <Box sx={{ width: 40 }} />} {/* Alignment placeholder */}
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
        <ChatWindow
          onMenuClick={toggleMembers}
          showMenuIcon={!isMembersOpen} // Hamburger appears when members tab is closed
        />
      </Box>
    </Box>
  );
}

export default ChatUI;
