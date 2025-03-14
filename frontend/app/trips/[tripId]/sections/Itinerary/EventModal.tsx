"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Chip,
} from "@mui/material";
import { Close, EditNote, Schedule, Add } from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { styled } from "@mui/material/styles";
import { Dialog } from "@mui/material";

import { CreateItineraryEvent, eventCategories } from "./types";
import {
  formatDateTimeForAPI,
  parseLocalDateWithTime,
} from "@/utils/dateFormatter";

import { useNotificationStore } from "@/stores/notification-store";
import LocationAutocomplete from "./LocationAutocomplete";
import { Member } from "@/types";

export const FloatingDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    width: "100%",
    maxWidth: "600px",
    maxHeight: "85vh",
    boxShadow: theme.shadows[10],
    overflow: "hidden",
  },
  "& .MuiBackdrop-root": {
    backdropFilter: "blur(8px)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
}));

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (eventData: CreateItineraryEvent) => void;
  members: Member[];
  tripStart: string;
  tripEnd: string;
}

export default function CreateEventDialog({
  open,
  onClose,
  onCreate,
  members,
  tripStart,
  tripEnd,
}: CreateEventDialogProps) {
  const theme = useTheme();
  const { setNotification } = useNotificationStore();
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const prevNotesLength = useRef(0);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (notes.length > prevNotesLength.current) {
      const container = notesContainerRef.current;
      if (container) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
    prevNotesLength.current = notes.length;
  }, [notes.length]);

  useEffect(() => {
    if (open && contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      } else {
        setHasScrolledToBottom(false);
      }
    }
  }, [open]);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = contentRef.current;
    // Using a small tolerance of 5px
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setHasScrolledToBottom(true);
    }
  };

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
      notes: notes
        .filter((note) => note.trim())
        .map((note) => ({ content: note.trim() })),
      assignedUserIds: selectedUserIds,
    });
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setCategory("GENERAL");
    setNotes([]);
    onClose();
    setSelectedUserIds([]);
    setHasScrolledToBottom(false);
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setCategory("GENERAL");
    setNotes([]);
    onClose();
    setSelectedUserIds([]);
    setHasScrolledToBottom(false);
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

  const handleAddNote = () => {
    if (notes.length >= 10) return;
    if (notes[notes.length - 1]?.trim() === "") {
      setNotification("Please fill current note before adding new", "warning");
      return;
    }
    setNotes([...notes, ""]);
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
          ref={contentRef}
          onScroll={handleScroll}
          sx={{
            px: 3,
            py: 0,
            pt: 2,
            backgroundColor: theme.palette.background.default,
            overflowY: "auto",
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
                placeholder="Add event details..."
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

            <Divider sx={{ my: 1 }} />

            <Box>
              <FormControl fullWidth>
                <InputLabel>Assign to Members</InputLabel>
                <Select
                  multiple
                  value={selectedUserIds}
                  onChange={(e) =>
                    setSelectedUserIds(e.target.value as string[])
                  }
                  label="Assign to Members"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((userId) => {
                        const member = members.find((m) => m.userId === userId);
                        return (
                          <Chip
                            key={userId}
                            label={member?.user.fullName || member?.user.email}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {members.map((member) => (
                    <MenuItem key={member.userId} value={member.userId}>
                      {member.user.fullName || member.user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Notes ({notes.length}/10)
              </Typography>
              <Box
                ref={notesContainerRef}
                sx={{
                  maxHeight: 200,
                  overflow: "auto",
                  mb: 1,
                  pr: 1,
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 3,
                  },
                }}
              >
                <Stack gap={2}>
                  {notes.map((note, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: 1,
                        mt: 1,
                        alignItems: "center",
                        transition: "opacity 0.2s",
                        "&:hover": { opacity: 0.9 },
                      }}
                    >
                      <TextField
                        fullWidth
                        label={`Note ${index + 1}`}
                        value={note}
                        multiline
                        onChange={(e) => {
                          const newNotes = [...notes];
                          newNotes[index] = e.target.value;
                          setNotes(newNotes);
                        }}
                        autoFocus={index === notes.length - 1}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  setNotes(notes.filter((_, i) => i !== index))
                                }
                                size="small"
                                edge="end"
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Button
                startIcon={<Add />}
                onClick={handleAddNote}
                size="small"
                disabled={notes.length >= 10}
                sx={{
                  alignSelf: "flex-start",
                  "&.Mui-disabled": { opacity: 0.6 },
                }}
              >
                Add note {notes.length > 0 && `(${notes.length}/10)`}
              </Button>
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
            disabled={!hasScrolledToBottom}
          >
            Create Event
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </FloatingDialog>
  );
}
