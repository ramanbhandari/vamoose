"use client";

import { Paper, Avatar, Typography, Chip } from "@mui/material";
import { styled } from "@mui/system";
import { Member } from "@/types";

// Optionally, you can use styled components to customize your card.
const StyledCard = styled(Paper)(({ theme }) => ({
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
}

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <StyledCard>
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
