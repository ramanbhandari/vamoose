"use client";
import React, { useState } from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import PollFilters from "./PollFilters";
import PollList from "./PollList";
import { fakePolls } from "./constants";
import { GradientHeader } from "../Overview/styled";
import { Member } from "@/types";

interface PollsProps {
  tripId: number;
  tripName: string;
  imageUrl?: string;
  members: Member[];
}

export default function Polls({
  tripId,
  tripName,
  imageUrl,
  members,
}: PollsProps) {
  const theme = useTheme();
  const [polls, setPolls] = useState(fakePolls);

  const handleVote = (pollId: number, optionId: number) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((opt) =>
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
              ),
            }
          : poll
      )
    );
  };

  return (
    <Box key={tripId}>
      <GradientHeader
        theme={theme}
        sx={{
          background: imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

          "&::after": imageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `url(${imageUrl}) center/cover no-repeat`,
                filter: "brightness(0.5) blur(4px)",
                zIndex: -2,
              }
            : "none",

          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              {tripName}
            </Typography>
          </Box>
        </Container>
      </GradientHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <PollFilters
            filters={{ status: "all", createdBy: "" }}
            members={members}
            onFilterChange={() => {}}
          />
          <PollList polls={polls} onVote={handleVote} />
        </Box>
      </Container>
    </Box>
  );
}
