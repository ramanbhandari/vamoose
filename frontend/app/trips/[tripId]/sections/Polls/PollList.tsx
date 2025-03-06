"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { People } from "@mui/icons-material";
import Masonry from "@mui/lab/Masonry";
import { Poll } from "./types";
import { useTheme } from "@mui/material/styles";

import PollItem from "./PollItem";

interface PollListProps {
  polls: Poll[];
  onDeletePoll: (pollId: number) => void;
  onCompletePoll: (pollIds: number[]) => void;
  onVote: (pollId: number, optionId: number) => void;
  onRemoveVote: (pollId: number, optionId: number) => void;
  active: boolean;
}

export default function PollList({
  polls,
  onDeletePoll,
  onCompletePoll,
  onVote,
  onRemoveVote,
  active,
}: PollListProps) {
  const theme = useTheme();

  return (
    <Box>
      {polls.length > 0 ? (
        <Masonry
          columns={{ xs: 1, sm: 2, md: 3 }}
          spacing={3}
          sx={{
            width: "auto",
            margin: 0,
            "& .MuiMasonry-root": {
              display: "flex",
              gap: "24px",
            },
          }}
        >
          {polls.map((poll) => (
            <div key={poll.id}>
              <PollItem
                poll={poll}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                onDeletePoll={onDeletePoll}
                onCompletePoll={onCompletePoll}
              />
            </div>
          ))}
        </Masonry>
      ) : (
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
      )}
    </Box>
  );
}
