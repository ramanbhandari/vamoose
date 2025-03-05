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
} from "@mui/material";
import {
  Whatshot,
  HourglassEmpty,
  HowToVote,
  People,
  Public,
  Event,
  CheckCircle,
  EmojiEvents,
  EmojiPeople,
} from "@mui/icons-material";
import { Poll } from "./types";
import { useTheme } from "@mui/material/styles";
import { formatDate } from "@/utils/dateFormatter";

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: number, optionId: number) => void;
}

export default function PollList({ polls, onVote }: PollListProps) {
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
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: -30,
                      backgroundColor:
                        poll.status === "active"
                          ? theme.palette.success.main
                          : theme.palette.primary.main,
                      transform: "rotate(45deg)",
                      width: 120,
                      textAlign: "center",
                      py: 0.5,
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "common.white" }}
                    >
                      {poll.status.toUpperCase()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      mt: 1,
                    }}
                  >
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      {getStatusIcon(poll.status)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {poll.question}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Event
                      sx={{ mr: 1, color: theme.palette.text.secondary }}
                    />
                    <Typography variant="caption">
                      Expires: {formatDate(poll.expiresAt)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ mt: 1, mb: 2, display: "flex", alignItems: "center" }}
                  >
                    <EmojiPeople
                      sx={{ mr: 1, color: theme.palette.text.secondary }}
                    />
                    <Typography variant="caption">
                      Created By: {poll.createdBy}
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
                            position: "relative",
                            ...(poll.status === "expired" &&
                            poll.winner?.id === option.id
                              ? {
                                  border: `2px solid ${theme.palette.success.main}`,
                                  borderRadius: 2,
                                  p: 1.5,
                                  ml: -1.5,
                                  mr: -1.5,
                                  background: `linear-gradient(45deg, ${theme.palette.success.light}22 30%, ${theme.palette.background.paper} 90%)`,
                                }
                              : {}),
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
                          {/* winner crown badge on the poll option that won*/}
                          {poll.status === "expired" &&
                            poll.winner?.id === option.id && (
                              <EmojiEvents
                                sx={{
                                  position: "absolute",
                                  top: -10,
                                  right: -10,
                                  fontSize: 24,
                                  color: theme.palette.warning.main,
                                  zIndex: 2,
                                  transform: "rotate(25deg)",
                                }}
                              />
                            )}

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                mr: 1,
                                ...(poll.status === "expired" &&
                                poll.winner?.id === option.id
                                  ? {
                                      color: theme.palette.success.dark,
                                    }
                                  : {}),
                              }}
                            >
                              {option.text}
                              {poll.status === "expired" &&
                                poll.winner?.id === option.id && (
                                  <CheckCircle
                                    sx={{
                                      fontSize: 16,
                                      ml: 1,
                                      color: theme.palette.success.main,
                                      verticalAlign: "text-bottom",
                                    }}
                                  />
                                )}
                            </Typography>
                            <Chip
                              label={`${option.votes} votes`}
                              size="small"
                              icon={<HowToVote fontSize="small" />}
                              sx={{
                                ml: "auto",
                                ...(poll.status === "expired" &&
                                poll.winner?.id === option.id
                                  ? {
                                      bgcolor: theme.palette.success.main,
                                      color: "common.white",
                                      "& .MuiChip-icon": {
                                        color: "common.white",
                                      },
                                    }
                                  : {}),
                              }}
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
                                    : poll.winner?.id === option.id
                                      ? theme.palette.success.main
                                      : theme.palette.text.disabled,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>

                  {poll.status === "expired" && poll.winner && (
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <EmojiEvents
                        sx={{
                          color: theme.palette.warning.main,
                          fontSize: 24,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {poll.winner.text} won!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {poll.winner.votes} votes •
                          {(
                            (poll.winner.votes /
                              poll.options.reduce(
                                (sum, o) => sum + o.votes,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %
                        </Typography>
                      </Box>
                    </Box>
                  )}
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
                Be the first to start a poll and get the group&apos;s opinion!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
