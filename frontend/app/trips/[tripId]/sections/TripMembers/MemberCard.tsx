"use client";

import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Slide,
  MenuItem,
  Menu,
} from "@mui/material";
import { Box } from "@mui/system";
import { Member } from "@/types";
import { DeleteOutline, Edit } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const handleEditClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (newRole: "admin" | "member") => {
    onRoleChange?.(member, newRole);
    setAnchorEl(null);
  };

  const canEdit =
    (currentUserRole === "creator" && member.role !== "creator") || // Creator can edit others but not themselves
    (currentUserRole === "admin" && member.role === "member"); // Admins can only edit members (only promote no demote)

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

        {(showDelete || canEdit) && (
          <Box
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              display: "flex",
              gap: 1,
            }}
          >
            {canEdit && (
              <IconButton size="small" onClick={handleEditClick}>
                <Edit />
              </IconButton>
            )}
            {showDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete?.(member.userId)}
              >
                <DeleteOutline />
              </IconButton>
            )}
          </Box>
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {/* admins can promote members to admins */}
          {currentUserRole === "admin" && member.role === "member" && (
            <MenuItem onClick={() => handleRoleChange("admin")}>
              Promote to Admin
            </MenuItem>
          )}

          {/* creator can promote or demote both admins and members */}
          {currentUserRole === "creator" && member.role === "member" && (
            <MenuItem onClick={() => handleRoleChange("admin")}>
              Promote to Admin
            </MenuItem>
          )}

          {currentUserRole === "creator" && member.role === "admin" && (
            <MenuItem onClick={() => handleRoleChange("member")}>
              Demote to Member
            </MenuItem>
          )}
        </Menu>
      </Paper>
    </Slide>
  );
}
