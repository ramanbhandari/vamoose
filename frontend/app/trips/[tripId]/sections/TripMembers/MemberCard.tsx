"use client";

import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Slide,
} from "@mui/material";
import { Box } from "@mui/system";
import { Member } from "@/types";
import { DeleteOutline } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface MemberCardProps {
  member: Member;
  checked?: boolean;
  onSelect?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  showDelete?: boolean;
  showCheckbox?: boolean;
}

export default function MemberCard({
  member,
  checked = false,
  onSelect,
  onDelete,
  showDelete = false,
  showCheckbox = false,
}: MemberCardProps) {
  const theme = useTheme();
  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          transition: "transform 0.1s, box-shadow 0.1s",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: theme.shadows[8],
          },
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        }}
      >
        {showCheckbox && (
          <Checkbox
            checked={checked}
            onChange={() => onSelect?.(member.userId)}
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              zIndex: 1,
            }}
          />
        )}

        {showDelete && (
          <IconButton
            onClick={() => onDelete?.(member.userId)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
              color: "error.main",
            }}
          >
            <DeleteOutline />
          </IconButton>
        )}

        <Avatar
          sx={{
            width: 72,
            height: 72,
            margin: "0 auto",
            mb: 1,
            fontSize: "1.5rem",
            fontWeight: 700,
            border: "2px solid white",
          }}
        >
          {member.role === "creator"
            ? "C"
            : member.role.charAt(0).toUpperCase()}
        </Avatar>
        <Box
          sx={{
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            {member.user.email}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Chip label={member.role} color="primary" size="small" />
        </Box>
      </Paper>
    </Slide>
  );
}
