"use client";
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Slide,
  Fade,
} from "@mui/material";
import {
  Whatshot,
  HourglassEmpty,
  HowToVote,
  People,
  Public,
  Event,
} from "@mui/icons-material";
import { Poll } from "./types";
import { useTheme } from "@mui/material/styles";

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: number, optionId: number) => void;
}

const PollList: React.FC<PollListProps> = ({ polls, onVote }) => {
  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Whatshot sx={{ color: theme.palette.success.main }} />;
      case "expired":
        return <HourglassEmpty sx={{ color: theme.palette.error.main }} />;
      default:
        return <Public sx={{ color: theme.palette.info.main }} />;
    }
  };

  return (
    <Box>
      <Grid container spacing={3} justifyContent="flex-start">
        {polls.length > 0 ? (
          polls.map((poll) => (
            <Grid item xs={12} sm={6} md={4} key={poll.id}>
              <Slide direction="up" in={true} mountOnEnter unmountOnExit>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: theme.shadows[8],
                    },
                    position: "relative",
                    overflow: "hidden",
                    background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                  }}
                >
                  {/* Status Ribbon */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: -30,
                      backgroundColor:
                        poll.status === "active"
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      transform: "rotate(45deg)",
                      width: 120,
                      textAlign: "center",
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "common.white" }}
                    >
                      {poll.status.toUpperCase()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      {getStatusIcon(poll.status)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {poll.question}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <Event
                      sx={{ mr: 1, color: theme.palette.text.secondary }}
                    />
                    <Typography variant="caption">
                      Expires: {new Date(poll.expiresAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    {poll.options.map((option) => {
                      const totalVotes = poll.options.reduce(
                        (sum, o) => sum + o.votes,
                        0
                      );
                      const percentage =
                        totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

                      return (
                        <Box
                          key={option.id}
                          onClick={() =>
                            poll.status === "active" &&
                            onVote(poll.id, option.id)
                          }
                          sx={{
                            mb: 2,
                            cursor:
                              poll.status === "active" ? "pointer" : "default",
                            transition: "transform 0.2s",
                            "&:hover":
                              poll.status === "active"
                                ? {
                                    transform: "scale(1.02)",
                                    "& .progressBar": {
                                      bgcolor: theme.palette.primary.light,
                                    },
                                  }
                                : {},
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, mr: 1 }}
                            >
                              {option.text}
                            </Typography>
                            <Chip
                              label={`${option.votes} votes`}
                              size="small"
                              icon={<HowToVote fontSize="small" />}
                              sx={{ ml: "auto" }}
                            />
                          </Box>
                          <LinearProgress
                            className="progressBar"
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: theme.palette.action.disabledBackground,
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 5,
                                bgcolor:
                                  poll.status === "active"
                                    ? theme.palette.primary.main
                                    : theme.palette.text.disabled,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>

                  <Fade in={poll.status === "expired"}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(255,255,255,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ color: theme.palette.text.disabled }}
                      >
                        Voting Closed
                      </Typography>
                    </Box>
                  </Fade>
                </Paper>
              </Slide>
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
                No Active Polls Yet!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Be the first to start a poll and get the group's opinion!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PollList;
