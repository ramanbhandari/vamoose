"use client";

import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/system";
import { Member } from "@/types";
import { DeleteOutline } from "@mui/icons-material";

const StyledCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  textAlign: "center",
  borderRadius: theme.shape.borderRadius * 2,
  transition: "transform 0.2s ease-in-out",
  cursor: "pointer",
  "&:hover": {
    transform: "scale(1.03)",
  },
}));

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
  return (
    <StyledCard>
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
        {member.role === "creator" ? "C" : member.role.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
        {member.user.email}
      </Typography>
      <Chip label={member.role} color="primary" size="small" />
    </StyledCard>
  );
}
