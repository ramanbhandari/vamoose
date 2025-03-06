"use client";
import React, { useState } from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import PollList from "./PollList";
import { fakePolls, fakePollsExpired } from "./constants";
import { GradientHeader } from "../Overview/styled";
import { Member } from "@/types";

import AddIcon from "@mui/icons-material/Add";
import { HeaderButton } from "./styled";
import CreatePollDialog from "./CreatePollDialog";
import { CreatePollRequest, PollOption } from "./types";
import apiClient from "@/utils/apiClient";
import { useNotificationStore } from "@/stores/notification-store";

interface PollsProps {
  tripId: number;
  tripName: string;
  imageUrl?: string;
  members: Member[];
}

export default function Polls({ tripId, tripName, imageUrl }: PollsProps) {
  const theme = useTheme();
  const [polls, setPolls] = useState(fakePolls);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { setNotification } = useNotificationStore();
  //const [loading, setLoading] = useState(false);

  const handleVote = (pollId: number, optionId: number) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((opt: PollOption) =>
                opt.id === optionId ? { ...opt, votes: opt.voteCount + 1 } : opt
              ),
            }
          : poll
      )
    );
  };

  const handleCreatePollSubmit = async (pollData: CreatePollRequest) => {
    // setLoading(true);
    try {
      console.log(pollData);
      const response = await apiClient.post(`/trips/${tripId}/polls`, pollData);
      console.log(response);

      setNotification("Successfully created new Poll!", "success");
    } catch (error) {
      setNotification("Failed to create new Poll. Please try again.", "error");
      console.error("Error creating Poll:", error);
    } finally {
      // setLoading(false);
    }
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

            <HeaderButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                ml: "auto",
                [theme.breakpoints.down("sm")]: {
                  ml: 0,
                  order: 1,
                },
              }}
            >
              Create New Poll
            </HeaderButton>
          </Box>
        </Container>
      </GradientHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Active Polls
          </Typography>
          <PollList polls={polls} onVote={handleVote} />
        </Box>
      </Container>

      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Expired Polls
          </Typography>
          <PollList polls={fakePollsExpired} onVote={handleVote} />
        </Box>
      </Container>

      <CreatePollDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={(pollData) => handleCreatePollSubmit(pollData)}
      />
    </Box>
  );
}
