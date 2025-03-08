"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import PollList from "./PollList";
import { GradientHeader } from "../Overview/styled";
import { Member } from "@/types";

import AddIcon from "@mui/icons-material/Add";
import { HeaderButton } from "./styled";
import CreatePollDialog from "./CreatePollDialog";
import { CreatePollRequest, Poll } from "./types";
import apiClient from "@/utils/apiClient";
import { usePollStore } from "@/stores/polls-store";
import { useNotificationStore } from "@/stores/notification-store";
import { usePollInteractionStore } from "@/stores/poll-interaction-store";
import { useUserStore } from "@/stores/user-store";

interface PollsProps {
  tripId: number;
  tripName: string;
  imageUrl?: string;
  activePolls: Poll[];
  completedPolls: Poll[];
  members: Member[];
}

export default function Polls({
  tripId,
  tripName,
  imageUrl,
  activePolls: initialActivePolls,
  completedPolls: initialCompletedPolls,
}: PollsProps) {
  const theme = useTheme();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { setNotification } = useNotificationStore();
  const { user } = useUserStore();

  const {
    polls,
    activePolls: storeActivePolls,
    completedPolls: storeCompletedPolls,
    loading,
    fetchPolls,
  } = usePollStore();

  const activePolls = storeActivePolls || initialActivePolls;
  const completedPolls = storeCompletedPolls || initialCompletedPolls;

  useEffect(() => {
    if (user) {
      usePollInteractionStore.getState().initializeUserVotes(polls, user.id);
    }
  }, [user, polls]);

  useEffect(() => {
    usePollInteractionStore.getState().clearSelection();
  }, [activePolls, completedPolls]);

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      await apiClient.post(`/trips/${tripId}/polls/${pollId}/vote`, {
        pollOptionId: optionId,
      });

      setNotification("Vote submitted successfully!", "success");
      await fetchPolls(tripId);
    } catch (error) {
      setNotification(
        "Failed to save Vote. Please refresh and try again!",
        "error"
      );
      console.error("Error saving/updating Vote:", error);
    }
  };

  const handleRemoveVote = async (pollId: number, optionId: number) => {
    try {
      await apiClient.delete(`/trips/${tripId}/polls/${pollId}/vote`, {
        data: { pollOptionId: optionId },
      });

      setNotification("Vote removed successfully!", "success");
      await fetchPolls(tripId);
    } catch (error) {
      setNotification(
        "Failed to remove Vote. Please refresh and try again!",
        "error"
      );
      console.error("Error removing Vote:", error);
    }
  };

  const handleCreatePollSubmit = async (pollData: CreatePollRequest) => {
    try {
      await apiClient.post(`/trips/${tripId}/polls`, pollData);

      setNotification("Successfully created new Poll!", "success");
      await fetchPolls(tripId);
    } catch (error) {
      setNotification(
        "Failed to create new Poll. Please refresh and try again!",
        "error"
      );
      console.error("Error creating Poll:", error);
    }
  };

  const handleDeletePoll = async (pollId: number) => {
    try {
      const response = await apiClient.delete(
        `/trips/${tripId}/polls/${pollId}`
      );
      console.log(response);

      setNotification("Deleted Poll Successfully!!", "success");
      await fetchPolls(tripId);
    } catch (error) {
      setNotification(
        "Failed to Delete Poll. Please refresh and try again!",
        "error"
      );
      console.error("Error deleting Poll:", error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <PollList
            polls={activePolls}
            onDeletePoll={handleDeletePoll}
            onVote={handleVote}
            onRemoveVote={handleRemoveVote}
            active
          />
        </Box>
      </Container>

      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Expired Polls
          </Typography>
          <PollList
            polls={completedPolls}
            onDeletePoll={handleDeletePoll}
            onVote={handleVote}
            onRemoveVote={handleRemoveVote}
            active={false}
          />
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
