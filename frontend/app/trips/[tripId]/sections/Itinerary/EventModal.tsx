"use client";

import React, { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Divider,
  useTheme,
  Stack,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Close, EditNote, Schedule } from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { FloatingDialog } from "../Polls/styled";

import { CreateItineraryEvent, eventCategories } from "./types";
import {
  formatDateTimeForAPI,
  parseLocalDateWithTime,
} from "@/utils/dateFormatter";

import { useNotificationStore } from "@/stores/notification-store";
import LocationAutocomplete from "./LocationAutocomplete";

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (eventData: CreateItineraryEvent) => void;
  tripStart: string;
  tripEnd: string;
}

export default function CreateEventDialog({
  open,
  onClose,
  onCreate,
  tripStart,
  tripEnd,
}: CreateEventDialogProps) {
  const theme = useTheme();
  const { setNotification } = useNotificationStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("GENERAL");

  const [error, setError] = useState("");

  const validateForm = () => {
    if (!title.trim()) {
      setNotification("Please enter an event title", "error");
      setError("Event title is required");
      return false;
    }
    if (!startTime.trim()) {
      setNotification("Please select a start time", "error");
      setError("Start time is required");
      return false;
    }
    if (!endTime.trim()) {
      setNotification("Please select an end time", "error");
      setError("End time is required");
      return false;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setNotification("End time must be after start time", "error");
      setError("End time must be after start time");
      return false;
    }
    if (!category.trim()) {
      setNotification("Please select a category", "error");
      setError("Category is required");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    onCreate({
      title,
      description: description.trim() ? description : undefined,
      location: location.trim() ? location : undefined,
      startTime,
      endTime,
      category: category as CreateItineraryEvent["category"],
    });
    // Reset form state
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setCategory("GENERAL");
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setCategory("GENERAL");
    onClose();
  };

  const handleStartTimeChange = (newValue: Date | null) => {
    if (newValue) {
      const formatted = formatDateTimeForAPI(newValue);
      setStartTime(formatted);
    }
  };

  const handleEndTimeChange = (newValue: Date | null) => {
    if (newValue) {
      const formatted = formatDateTimeForAPI(newValue);
      setEndTime(formatted);
    }
  };

  return (
    <FloatingDialog open={open} onClose={handleClose}>
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
              New Event
            </Typography>
            <IconButton onClick={handleClose} size="small">
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
                label="Event Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            <Box>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                variant="outlined"
                multiline
                rows={3}
              />
            </Box>

            <Box>
              <LocationAutocomplete
                value={location}
                onChange={(val) => setLocation(val)}
                onSelect={(selectedOption) => {
                  console.log("Selected location:", selectedOption);
                }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Grid container spacing={2}>
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
                  label="Start Time*"
                  value={startTime ? parseLocalDateWithTime(startTime) : null}
                  disablePast
                  onChange={handleStartTimeChange}
                  // Set min and max based on trip start and end dates
                  minDateTime={parseLocalDateWithTime(tripStart) ?? new Date()}
                  maxDateTime={parseLocalDateWithTime(tripEnd) ?? new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { backgroundColor: theme.palette.background.default },
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
                  label="End Time*"
                  value={endTime ? parseLocalDateWithTime(endTime) : null}
                  disablePast
                  onChange={handleEndTimeChange}
                  minDateTime={
                    startTime
                      ? new Date(startTime)
                      : (parseLocalDateWithTime(tripStart) ?? new Date())
                  }
                  maxDateTime={parseLocalDateWithTime(tripEnd) ?? new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { backgroundColor: theme.palette.background.default },
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
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {eventCategories.map((cat: string) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            Create Event
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </FloatingDialog>
  );
}
