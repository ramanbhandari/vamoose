"use client";

import React, { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Divider,
  useTheme,
  Stack,
  InputAdornment,
  Grid,
} from "@mui/material";
import {
  Close,
  Add,
  Remove,
  Schedule,
  HowToVote,
  EditNote,
  CheckCircle,
} from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { FloatingDialog } from "./styled";

import { CreatePollRequest } from "./types";
import {
  formatDateTimeForAPI,
  parseLocalDateWithTime,
} from "@/utils/dateFormatter";

import { useNotificationStore } from "@/stores/notification-store";

interface CreatePollDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (pollData: CreatePollRequest) => void;
}

export default function CreatePollDialog({
  open,
  onClose,
  onCreate,
}: CreatePollDialogProps) {
  const theme = useTheme();
  const { setNotification } = useNotificationStore();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAtDate, setExpiresAtDate] = useState("");
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!question.trim()) {
      setNotification("Please enter a question", "error");
      setError("Please enter a question");
      return false;
    }
    if (options.some((opt) => !opt.trim())) {
      setNotification(
        "Please provide at least 2 options and/or delete additional empty options!",
        "error"
      );
      setError("All options must be filled");
      return false;
    }

    const allOptions = options.map((opt) => opt.trim());
    if (new Set(allOptions).size !== allOptions.length) {
      setNotification("Duplicate options are not allowed!", "error");
      setError("Duplicate options are not allowed");
      return false;
    }

    if (!expiresAtDate.trim()) {
      setNotification("Please enter a deadline", "error");
      setError("Please enter a deadline");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreate = () => {
    if (!validateForm() || !expiresAtDate) return;
    onCreate({
      question,
      options: options.filter((opt) => opt.trim()),
      expiresAt: expiresAtDate,
    });
    setQuestion("");
    setOptions(["", ""]);
    setExpiresAtDate("");
    onClose();
  };

  const handleClose = () => {
    setQuestion("");
    setOptions(["", ""]);
    setExpiresAtDate("");
    onClose();
  };

  const handleExpiresAtDate = (newValue: Date | null) => {
    if (newValue) {
      const formattedDate = formatDateTimeForAPI(newValue);

      setExpiresAtDate(formattedDate);
    }
  };

  return (
    <FloatingDialog open={open} onClose={onClose}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <Typography variant="h6" fontWeight={600}>
              New Poll
            </Typography>
            <IconButton onClick={onClose} size="small">
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
          <Stack gap={3}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Poll question"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EditNote sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, 16px) scale(1)",
                  },
                  "& .MuiInputLabel-shrink": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                }}
              />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                Options
              </Typography>
              <Stack gap={2}>
                {options.map((option, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      "&:not(:last-child)": { mb: 1 },
                    }}
                  >
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      required
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <HowToVote sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {options.length > 2 && (
                      <IconButton
                        onClick={() =>
                          setOptions(options.filter((_, i) => i !== index))
                        }
                        size="small"
                        sx={{ ml: -0.5 }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={() => setOptions([...options, ""])}
                  size="small"
                  sx={{
                    alignSelf: "flex-start",
                    mt: 1,
                  }}
                >
                  Add option
                </Button>
              </Stack>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
              {" "}
              <Grid container spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <DateTimePicker
                      label="Deadline*"
                      value={parseLocalDateWithTime(expiresAtDate)}
                      disablePast
                      onChange={handleExpiresAtDate}
                      minDateTime={new Date()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: {
                            backgroundColor: theme.palette.background.default,
                          },
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Schedule sx={{ color: "text.secondary" }} />
                              </InputAdornment>
                            ),
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              backgroundColor: theme.palette.background.default,
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                </LocalizationProvider>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      gap: 1,
                      color: "text.secondary",
                      pt: { md: 1 },
                    }}
                  >
                    <CheckCircle sx={{ color: "success.main" }} />
                    <Typography variant="body2">
                      Visible to all trip members
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            {error && (
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Button onClick={handleClose} color="inherit" sx={{ mr: "auto" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            sx={{
              px: 3,
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            Create Poll
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </FloatingDialog>
  );
}
