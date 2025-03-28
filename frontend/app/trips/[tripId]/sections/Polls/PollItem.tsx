"use client";

/**
 * @file PollItem.tsx
 * @description A card component that displays a single poll with voting logic, result display, and controls for delete/end actions.
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Slide,
  Paper,
  Avatar,
  Chip,
  Stack,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Poll } from "./types";
import { FloatingDialogSmall } from "./styled";
import {
  CheckCircle,
  EmojiEvents,
  EmojiPeople,
  HourglassEmpty,
  HowToVote,
  Whatshot,
  Event,
  DeleteOutline,
  Close,
  DoneAll,
  Balance,
} from "@mui/icons-material";
import { formatDateTime } from "@/utils/dateFormatter";
import { usePollInteractionStore } from "@/stores/poll-interaction-store";
import { useUserStore } from "@/stores/user-store";
import { getUserInfo } from "@/utils/userHelper";
import { useTripStore } from "@/stores/trip-store";

interface PollItemProps {
  poll: Poll;
  onDeletePoll: (pollId: number) => void;
  onVote: (pollId: number, optionId: number) => void;
  onRemoveVote: (pollId: number, optionId: number) => void;
  onCompletePoll: (pollId: number) => void;
}

export default function PollItem({
  poll,
  onDeletePoll,
  onVote,
  onRemoveVote,
  onCompletePoll,
}: PollItemProps) {
  const { user } = useUserStore();
  const theme = useTheme();
  const {
    activePollId,
    selectedOptionId,
    userVotes,
    setActivePoll,
    setUserVote,
    clearSelection,
  } = usePollInteractionStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const userInfo = user ? getUserInfo(user) : null;
  const { tripData } = useTripStore();

  const showDelete =
    (userInfo?.isCreator(tripData) ||
      userInfo?.isAdmin(tripData) ||
      userInfo?.id === poll.createdBy.id) &&
    poll.status !== "COMPLETED" &&
    poll.status !== "TIE";

  const userPreviousVote = userVotes[poll.id];

  const userVote = poll.options.find((option) =>
    option.voters.some((voter) => voter.id === user?.id)
  );

  const winningOptionIds = new Set<number>();

  if (poll.status === "TIE" && poll.winner && "options" in poll.winner) {
    poll.winner.options.forEach((w) => winningOptionIds.add(w.id));
  } else if (
    poll.status === "COMPLETED" &&
    poll.winner &&
    !("options" in poll.winner)
  ) {
    winningOptionIds.add(poll.winner.id);
  }

  const handleOptionClick = (optionId: number) => {
    if (poll.status !== "ACTIVE") return;

    if (activePollId === poll.id) {
      const newSelection = selectedOptionId === optionId ? null : optionId;
      setActivePoll(newSelection ? poll.id : null, newSelection);
    } else {
      // Switch active poll
      setActivePoll(poll.id, optionId);
    }
  };

  const handleVoteSubmit = () => {
    if (selectedOptionId) {
      onVote(poll.id, selectedOptionId);
      setUserVote(poll.id, selectedOptionId);
    }
    clearSelection();
  };

  const handleRemoveVote = () => {
    if (selectedOptionId) {
      onRemoveVote(poll.id, selectedOptionId);
    }
    clearSelection();
  };

  const handleDeletePoll = () => {
    onDeletePoll(poll.id);
    setConfirmOpen(false);
  };

  const handleCompletePoll = () => {
    onCompletePoll(poll.id);
    setCompleteConfirmOpen(false);
  };

  const getOptionStyle = (optionId: number) => ({
    border:
      userVote?.id === optionId
        ? `2px solid ${theme.palette.primary.main}`
        : "none",
    background:
      userPreviousVote === optionId
        ? theme.palette.primary.light + "22"
        : "transparent",
    borderRadius: "8px",
    padding: "8px",
  });

  const getSelectedStyle = (optionId: number) => ({
    border:
      selectedOptionId === optionId
        ? `2px solid ${theme.palette.secondary.main}`
        : "none",
    background:
      selectedOptionId === optionId
        ? theme.palette.secondary.light + "22"
        : "transparent",
    borderRadius: "8px",
    padding: "8px",
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Whatshot />;
      case "COMPLETED":
        return <HourglassEmpty />;
      default:
        return <HowToVote />;
    }
  };

  return (
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
              poll.status === "ACTIVE"
                ? theme.palette.success.main
                : poll.status === "TIE"
                  ? theme.palette.warning.main
                  : theme.palette.primary.main,
            transform: "rotate(45deg)",
            width: 120,
            textAlign: "center",
            py: 0.5,
            zIndex: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "common.white" }}>
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
          <Avatar
            sx={{
              bgcolor:
                poll.status === "ACTIVE"
                  ? theme.palette.success.main
                  : poll.status === "TIE"
                    ? theme.palette.warning.main
                    : theme.palette.primary.main,
              mr: 2,
            }}
          >
            {getStatusIcon(poll.status)}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {poll.question}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Event sx={{ mr: 1, color: theme.palette.text.secondary }} />
          <Typography variant="caption">
            {poll.status === "ACTIVE"
              ? `Expires: ${formatDateTime(poll.expiresAt)}`
              : `Completed: ${poll.completedAt ? formatDateTime(poll.completedAt) : formatDateTime(poll.expiresAt)}`}
          </Typography>
        </Box>
        <Box sx={{ mt: 1, mb: 2, display: "flex", alignItems: "center" }}>
          <EmojiPeople sx={{ mr: 1, color: theme.palette.text.secondary }} />
          <Typography variant="caption">
            Created By:{" "}
            {poll.createdBy.fullName
              ? poll.createdBy.fullName
              : poll.createdBy.email}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          {poll.options.map((option) => {
            const totalVotes = poll.options.reduce(
              (sum, o) => sum + o.voteCount,
              0
            );
            const percentage = totalVotes > 0 ? option.percentage : 0;

            return (
              <Box
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                sx={{
                  ...getOptionStyle(option.id),
                  ...(activePollId === poll.id && getSelectedStyle(option.id)),
                  mb: 2,
                  cursor: poll.status === "ACTIVE" ? "pointer" : "default",
                  transition: "transform 0.2s",
                  position: "relative",
                  ...(winningOptionIds.has(option.id)
                    ? poll.status === "TIE"
                      ? {
                          border: `2px solid ${theme.palette.warning.main}`,
                          borderRadius: 2,
                          p: 1.5,
                          ml: -1.5,
                          mr: -1.5,
                          background: `linear-gradient(45deg, ${theme.palette.warning.light}22 30%, ${theme.palette.background.paper} 90%)`,
                        }
                      : poll.status === "COMPLETED"
                        ? {
                            border: `2px solid ${theme.palette.success.main}`,
                            borderRadius: 2,
                            p: 1.5,
                            ml: -1.5,
                            mr: -1.5,
                            background: `linear-gradient(45deg, ${theme.palette.success.light}22 30%, ${theme.palette.background.paper} 90%)`,
                          }
                        : {}
                    : {}),
                  "&:hover":
                    poll.status === "ACTIVE"
                      ? {
                          transform: "scale(1.02)",
                        }
                      : {},
                }}
              >
                {userPreviousVote === option.id && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Your vote
                  </Typography>
                )}

                {poll.status === "COMPLETED" &&
                  winningOptionIds.has(option.id) && (
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
                      ...(poll.status === "COMPLETED" &&
                      winningOptionIds.has(option.id)
                        ? {
                            color: theme.palette.success.dark,
                          }
                        : {}),
                    }}
                  >
                    {option.option}
                    {poll.status === "COMPLETED" &&
                      winningOptionIds.has(option.id) && (
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
                    label={`${option.voteCount} votes`}
                    size="small"
                    icon={<HowToVote fontSize="small" />}
                    sx={{
                      ml: "auto",
                      ...(winningOptionIds.has(option.id) &&
                        (poll.status === "TIE"
                          ? {
                              bgcolor: theme.palette.warning.main,
                              color: "common.white",
                              "& .MuiChip-icon": { color: "common.white" },
                            }
                          : poll.status === "COMPLETED"
                            ? {
                                bgcolor: theme.palette.success.main,
                                color: "common.white",
                                "& .MuiChip-icon": { color: "common.white" },
                              }
                            : {})),
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
                        poll.status === "ACTIVE"
                          ? theme.palette.primary.main
                          : winningOptionIds.has(option.id)
                            ? poll.status === "TIE"
                              ? theme.palette.warning.main
                              : theme.palette.success.main
                            : theme.palette.text.disabled,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {poll.status === "COMPLETED" &&
          poll.winner &&
          !("options" in poll.winner) && (
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
                  {poll.winner.option} won!
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {poll.winner.voteCount} vote(s)
                </Typography>
              </Box>
            </Box>
          )}

        {poll.status === "TIE" && poll.winner && "options" in poll.winner && (
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
            <Balance
              sx={{
                color: theme.palette.warning.main,
                fontSize: 24,
              }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tied with {poll.winner.options[0]?.voteCount} vote(s)
              </Typography>
            </Box>
          </Box>
        )}

        {activePollId === poll.id && (
          <Stack direction="row" spacing={2}>
            {selectedOptionId === userVote?.id ? (
              <Button
                variant="contained"
                onClick={handleRemoveVote}
                size="small"
                sx={{ flex: 1, py: 1.5 }}
                disabled={!selectedOptionId}
                startIcon={<HowToVote />}
              >
                Remove Vote
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleVoteSubmit}
                size="small"
                sx={{ flex: 1, py: 1.5 }}
                disabled={!selectedOptionId}
                startIcon={<HowToVote />}
              >
                {userVote ? "Change Vote" : "Confirm Vote"}
              </Button>
            )}
          </Stack>
        )}
        {showDelete && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
              width: "100%",
            }}
          >
            <Button
              variant="text"
              onClick={() => setConfirmOpen(true)}
              startIcon={<DeleteOutline />}
              sx={{
                color: "primary.main",
                fontSize: "0.8rem",
                "&:hover": {
                  transform: "translateY(-1px)",
                  fontWeight: "700",
                  backgroundColor: "transparent",
                },
              }}
            >
              Delete
            </Button>
            {poll.totalVotes > 0 && (
              <Button
                variant="text"
                onClick={() => setCompleteConfirmOpen(true)}
                startIcon={<DoneAll />}
                sx={{
                  color: "success.main",
                  fontSize: "0.8rem",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    fontWeight: "700",
                    backgroundColor: "transparent",
                  },
                }}
              >
                End Poll
              </Button>
            )}
          </Box>
        )}

        <FloatingDialogSmall open={confirmOpen}>
          <DialogTitle
            sx={{
              p: 0,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                pb: 2,
              }}
            >
              <Typography variant="h5" fontWeight={600} color="text.primary">
                Delete Poll
              </Typography>

              <IconButton onClick={() => setConfirmOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{
              px: 3,
              py: 0,
              pt: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Typography variant="body1">
              Are you sure you want to delete this Poll?
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              pt: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Button
              onClick={() => setConfirmOpen(false)}
              color="inherit"
              sx={{ mr: "auto" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeletePoll}
              sx={{
                px: 3,
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </FloatingDialogSmall>

        <FloatingDialogSmall open={completeConfirmOpen}>
          <DialogTitle
            sx={{
              p: 0,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                pb: 2,
              }}
            >
              <Typography variant="h5" fontWeight={600} color="text.primary">
                End the Poll
              </Typography>

              <IconButton
                onClick={() => setCompleteConfirmOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{
              px: 3,
              py: 0,
              pt: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Typography variant="body1">
              Are you sure you want to end this Poll?
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              pt: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Button
              onClick={() => setCompleteConfirmOpen(false)}
              color="inherit"
              sx={{ mr: "auto" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCompletePoll}
              sx={{
                px: 3,
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </FloatingDialogSmall>
      </Paper>
    </Slide>
  );
}
