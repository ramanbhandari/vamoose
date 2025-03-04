"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  useTheme,
} from "@mui/material";
import { Poll } from "./types";
import { PollCard } from "./styled";

interface PollItemProps {
  poll: Poll;
  onVote: (pollId: number, optionId: number) => void;
}

const PollItem: React.FC<PollItemProps> = ({ poll, onVote }) => {
  const theme = useTheme();
  return (
    <PollCard theme={theme} sx={{ my: 2 }}>
      <Typography variant="h6" fontWeight="600">
        {poll.question}
      </Typography>

      {poll.options.map((option) => (
        <Box key={option.id} sx={{ my: 1 }}>
          <Typography variant="body2">{option.text}</Typography>
          <LinearProgress
            variant="determinate"
            value={
              (option.votes /
                Math.max(
                  1,
                  poll.options.reduce((acc, o) => acc + o.votes, 0)
                )) *
              100
            }
            sx={{ my: 1 }}
          />
          {poll.status === "active" && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onVote(poll.id, option.id)}
            >
              Vote
            </Button>
          )}
        </Box>
      ))}

      <Typography variant="caption" color="text.secondary">
        {poll.status === "active" ? "Active Poll" : "Closed Poll"}
      </Typography>
    </PollCard>
  );
};

export default PollItem;
