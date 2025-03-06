"use client";
import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { People } from "@mui/icons-material";
import { Poll } from "./types";
import { useTheme } from "@mui/material/styles";

import PollItem from "./PollItem";

interface PollListProps {
  polls: Poll[];
  onDeletePoll: (pollId: number) => void;
  onVote: (pollId: number, optionId: number) => void;
  onRemoveVote: (pollId: number, optionId: number) => void;
  active: boolean;
}

export default function PollList({
  polls,
  onDeletePoll,
  onVote,
  onRemoveVote,
  active,
}: PollListProps) {
  const theme = useTheme();

  return (
    <Box>
      <Grid container spacing={3} justifyContent="flex-start">
        {polls.length > 0 ? (
          polls.map((poll) => (
            <Grid item xs={12} sm={6} md={4} key={poll.id}>
              <PollItem
                poll={poll}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                onDeletePoll={onDeletePoll}
              />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 8,
                textAlign: "center",
                background: `linear-gradient(45deg, ${theme.palette.background.default} 30%, ${theme.palette.action.hover} 90%)`,
                borderRadius: 6,
              }}
            >
              <People
                sx={{
                  fontSize: 80,
                  color: theme.palette.text.secondary,
                  mb: 2,
                }}
              />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                {active ? "No Active Polls Yet!" : "No Expired Polls Yet!"}
              </Typography>
              {active && (
                <Typography variant="body1" color="text.secondary">
                  Be the first to start a poll and get the group&apos;s opinion!
                </Typography>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
