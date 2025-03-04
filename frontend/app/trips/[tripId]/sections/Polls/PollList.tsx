"use client";

import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import PollItem from "./PollItem";
import { Poll } from "./types";

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: number, optionId: number) => void;
}

const PollList: React.FC<PollListProps> = ({ polls, onVote }) => {
  return (
    <Box>
      {polls.length > 0 ? (
        polls.map((poll) => (
          <PollItem key={poll.id} poll={poll} onVote={onVote} />
        ))
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No polls found
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PollList;
