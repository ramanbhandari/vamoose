"use client";

/**
 * @file TravelSquad.tsx
 * @description Displays a section with avatars of all trip members ("Travel Squad") 
 * and a call-to-action button to invite more members.
 * Includes role-based avatar initials, hover effects, and responsive layout.
 */

import {
  Box,
  Typography,
  Button,
  Avatar,
  useTheme,
  Tooltip,
} from "@mui/material";
import { Group, GroupAdd } from "@mui/icons-material";
import { motion } from "framer-motion";
import { TwoColSectionContainer } from "./styled";
import { Member } from "@/types";

const getInitials = (member: Member) => {
  if (!member.user.fullName)
    return member.role === "creator"
      ? "C"
      : member.role.charAt(0).toUpperCase();
  const names = member.user.fullName.split(" ");
  return names
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const MemberAvatar = ({ member }: { member: Member }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Tooltip
      title={member.user.fullName ? member.user.fullName : member.user.email}
      arrow
      slotProps={{
        tooltip: {
          sx: {
            fontSize: "1.1rem",
            padding: "8px",
          },
        },
      }}
    >
      <Avatar
        sx={{
          width: 72,
          height: 72,
          fontSize: "1.5rem",
          fontWeight: 700,
          boxShadow: 3,
          border: "2px solid white",
        }}
      >
        {getInitials(member)}
      </Avatar>
    </Tooltip>
  </motion.div>
);

interface TravelSquadProps {
  members: Member[];
  onInvite: () => void;
}

export default function TravelSquad({ members, onInvite }: TravelSquadProps) {
  const theme = useTheme();

  return (
    <TwoColSectionContainer theme={theme}>
      <Box mb={3}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Group fontSize="large" />
          Travel Squad
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {members.length} adventurers joining the journey
        </Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        {members.map((member, index) => (
          <MemberAvatar key={index} member={member} />
        ))}
      </Box>

      <motion.div whileHover={{ scale: 1.05 }}>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<GroupAdd />}
          sx={{
            borderRadius: 3,
            py: 1.5,
            fontSize: "1.1rem",
          }}
          onClick={onInvite}
        >
          Invite More Explorers
        </Button>
      </motion.div>
    </TwoColSectionContainer>
  );
}
