"use client";

import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Slide,
  Button,
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
  onRoleChange?: (member: Member, newRole: "admin" | "member") => void;
  showDelete?: boolean;
  showCheckbox?: boolean;
  currentUserRole: "creator" | "admin" | "member";
}

export default function MemberCard({
  member,
  checked = false,
  onSelect,
  onDelete,
  onRoleChange,
  showDelete = false,
  showCheckbox = false,
  currentUserRole,
}: MemberCardProps) {
  const theme = useTheme();

  const getInitials = (name: string | null) => {
    if (!name)
      return member.role === "creator"
        ? "C"
        : member.role.charAt(0).toUpperCase();
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
          {getInitials(member.user.fullName)}
        </Avatar>
        <Box
          sx={{
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            {member.user.fullName ? member.user.fullName : member.user.email}
          </Typography>
        </Box>

        {member.user.fullName !== null && (
          <Box
            sx={{
              display: "flex",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1 }}>
              {member.user.email}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Chip
            label={member.role.toUpperCase()}
            color={
              member.role === "creator" || member.role === "admin"
                ? "primary"
                : "secondary"
            }
            size="small"
          />
        </Box>

        {(currentUserRole === "creator" || currentUserRole === "admin") &&
          member.role !== "creator" && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
              }}
            >
              {member.role === "member" && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => onRoleChange?.(member, "admin")}
                >
                  Make Admin
                </Button>
              )}

              {member.role === "admin" && currentUserRole === "creator" && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => onRoleChange?.(member, "member")}
                >
                  Change role to Member
                </Button>
              )}
            </Box>
          )}
      </Paper>
    </Slide>
  );
}
