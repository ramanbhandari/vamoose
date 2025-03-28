"use client";

/**
 * @file TripHeader.tsx
 * @description Header section for the Trip Summary page. Displays and allows editing of trip metadata 
 * (name, dates, destination, budget, description) with role-based permissions and action buttons for 
 * editing, saving, deleting, or leaving the trip.
 */

import { useEffect, useState, useRef } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  TextField,
  CircularProgress,
  Popper,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Grid,
  Container,
  Typography,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Close,
  DateRange,
  Delete,
  Edit,
  ExitToApp,
  FlightLand,
  FlightTakeoff,
  Save,
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

import { addDays, formatISO, parseISO } from "date-fns";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { CitySuggestion, PhotonAPIResponse, TripData } from "@/types";
import { useTripStore } from "@/stores/trip-store";
import { useNotificationStore } from "@/stores/notification-store";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import { useUserStore } from "@/stores/user-store";
import { getUserInfo } from "@/utils/userHelper";
import apiClient from "@/utils/apiClient";

import { GradientHeader, HeaderGrid } from "./styled";
import { formatDate, parseLocalDate } from "@/utils/dateFormatter";
import { motion } from "framer-motion";
import BudgetDonut from "@/components/trips/Overview/BudgetDonut";
import { DateTime } from "luxon";

interface TripHeaderProps {
  tripData: TripData;
}

const LocationPill = ({ label }: { label: string }) => (
  <motion.div whileHover={{ y: -3 }}>
    <Chip
      label={label}
      icon={<FlightLand />}
      color="secondary"
      sx={{
        px: 3,
        py: 1.5,
        fontSize: "1.1rem",
        fontWeight: 600,
      }}
    />
  </motion.div>
);

export default function TripHeader({ tripData }: TripHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useTheme();

  // use tripStore and NotificationStore for state management
  const { fetchTripData } = useTripStore();
  const { setNotification, clearNotification } = useNotificationStore();

  const user = useUserStore((state) => state.user);

  const userInfo = user ? getUserInfo(user) : null;
  const isCreator = userInfo?.isCreator(tripData) ?? false;
  const isAdmin = userInfo?.isAdmin(tripData) ?? false;

  const startDate = DateTime.fromISO(tripData.startDate).toUTC();
  const isUpcoming = startDate > DateTime.now().toUTC();

  const isEditable = (isCreator || isAdmin) && isUpcoming;

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [tripDetails, setTripDetails] = useState({
    name: tripData.name || "",
    destination: tripData.destination || "",
    startDate: tripData.startDate || "",
    endDate: tripData.endDate || "",
    budget: tripData.budget?.toString() || "",
    currency: "CAD",
    description: tripData.description || "",
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);

  // Check for edit parameter in URL when component mounts
  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (editParam === "true") {
      setIsEditMode(true);
    }
  }, [searchParams]);

  const handleStartDateChange = (newValue: Date | null) => {
    if (newValue) {
      const formattedDate = formatISO(newValue, { representation: "date" });

      setTripDetails({ ...tripDetails, startDate: formattedDate });
    }
  };

  const handleEndDateChange = (newValue: Date | null) => {
    if (newValue) {
      const formattedDate = formatISO(newValue, { representation: "date" });

      setTripDetails({ ...tripDetails, endDate: formattedDate });
    }
  };

  const handleDestinationChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setTripDetails((prev) => ({
      ...prev,
      destination: value ?? "",
    }));

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`
      );
      const data: PhotonAPIResponse = await response.json();

      setSuggestions(
        data.features.map((place) => ({
          name: place.properties.name,
          country: place.properties.country,
          lat: place.geometry.coordinates[1],
          lon: place.geometry.coordinates[0],
        }))
      );
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
    }
  };

  const handleSelectCity = (city: CitySuggestion) => {
    if (!city || !city.name || !city.country) return;

    setTripDetails((prev) => ({
      ...prev,
      destination: `${city.name}, ${city.country}`,
    }));

    setSuggestions([]);
  };

  const handleReset = () => {
    setTripDetails({
      name: tripData.name || "",
      destination: tripData.destination || "",
      startDate: tripData.startDate || "",
      endDate: tripData.endDate || "",
      budget: tripData.budget?.toString() || "",
      currency: "CAD",
      description: tripData.description || "",
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
    // remove the edit=true param after cancel if it exists
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");

    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });

    handleReset();
    clearNotification();
  };

  const handleSave = async () => {
    // Reset any existing errors
    clearNotification();

    // Collect all validation errors
    const errors: string[] = [];

    if (!tripDetails.name.trim()) errors.push("Trip name is required");
    if (!tripDetails.destination.trim()) errors.push("Destination is required");
    if (!tripDetails.startDate) errors.push("Start date is required");
    if (!tripDetails.endDate) errors.push("End date is required");
    if (!tripDetails.budget) errors.push("Budget is required");

    const start = parseLocalDate(tripDetails.startDate);
    const end = parseLocalDate(tripDetails.endDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = parseLocalDate(today.toISOString());

    if (!start || !end) {
      errors.push("Something went wrong, please try again!", "error");
    } else if (start >= end) {
      errors.push("End date must be after start date");
    } else if (now && start.getTime() < now.getTime()) {
      errors.push("Start date of the trip cannot be in past");
    }

    // If there are any validation errors, stack em up
    if (errors.length > 0) {
      setNotification(errors.join(" • "), "error");
      handleReset();
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: tripDetails.name.trim(),
        destination: tripDetails.destination.trim(),
        startDate: tripDetails.startDate,
        endDate: tripDetails.endDate,
        budget: parseFloat(tripDetails.budget) || 0,
        description: tripDetails.description || "",
      };

      await apiClient.patch(`/trips/${tripData?.id}`, payload);

      // update notification store
      setNotification("Trip details updated successfully!", "success");
      setIsEditMode(false);
      // re-fetch so UI updates
      await fetchTripData(tripData.id);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Server error";
        setNotification(`Error updating trip: ${errorMessage}`, "error");
        console.error(
          "Axios error:",
          error.response?.status,
          error.response?.data
        );
      } else {
        setNotification("Unexpected error occurred", "error");
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
      handleReset();
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/trips/${tripData?.id}`);
      setNotification("Trip deleted successfully!", "success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Server error";
        setNotification(`Error deleting trip: ${errorMessage}`, "error");
      } else {
        setNotification(
          "Unexpected error occurred while deleting trip",
          "error"
        );
      }
      console.error("Error deleting trip:", error);
    }
  };

  const handleLeaveTrip = async () => {
    if (!isCreator) {
      try {
        await apiClient.delete(`/trips/${tripData?.id}/members/leave`);
        setNotification("Successfully left the trip!", "success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message || "Unable to leave trip";
          setNotification(`Error leaving trip: ${message}`, "error");
          console.error("Axios error leaving trip:", error);
        } else {
          setNotification(
            "Unexpected error occurred while leaving trip",
            "error"
          );
          console.error("Unexpected error leaving trip:", error);
        }
      }
    } else {
      setNotification(
        "You cannot leave the trip because you are the creator.",
        "error"
      );
    }
  };

  const getTripStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) return "Upcoming"; // If today is before the start date
    if (today >= start && today <= end) return "Current"; // If today is within the trip dates
    return "Past"; // If today is after the end date
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");

    // Don't allow multiple decimal points
    if ((rawValue.match(/\./g) || []).length > 1) return;

    setTripDetails((prev) => ({
      ...prev,
      budget: rawValue,
    }));
  };

  const handleBudgetBlur = () => {
    if (!tripDetails.budget) return;

    const number = parseFloat(tripDetails.budget);
    if (isNaN(number)) return;

    setTripDetails((prev) => ({
      ...prev,
      budget: number.toFixed(2),
    }));
  };

  if (!tripData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GradientHeader
      theme={theme}
      sx={{
        background: tripData.imageUrl
          ? "none"
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

        "&::after": tripData.imageUrl
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `url(${tripData.imageUrl}) center/cover no-repeat`,
              filter: "brightness(0.5) blur(4px)",
              zIndex: -2,
            }
          : "none",

        "& > *": {
          position: "relative",
          zIndex: 1,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: -4,
          mb: 4,
        }}
      >
        {isEditMode ? (
          <Box display="flex" gap={0}>
            <Tooltip
              title="Cancel"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.background.default,
                  },
                },
              }}
            >
              <IconButton
                onClick={handleCancel}
                sx={{
                  background: "none",
                  color: "white",
                  transition: "transform 0.3s, color 0.5s",
                  "&:hover": {
                    background: "none",
                    transform: "scale(1.2)",
                    color: "primary.main",
                  },
                }}
              >
                <Close fontSize="large" />
              </IconButton>
            </Tooltip>

            <Tooltip
              title="Save"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.background.default,
                  },
                },
              }}
            >
              <IconButton
                onClick={() => {
                  handleSave();
                  setIsEditMode(false);
                }}
                disabled={loading}
                sx={{
                  background: "none",
                  color: "white",
                  transition: "transform 0.3s, color 0.5s",
                  "&:hover": {
                    background: "none",
                    transform: "scale(1.2)",
                    color: "var(--accent)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <Save fontSize="large" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            {isEditable && (
              <Tooltip
                title="Edit"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.background.default,
                    },
                  },
                }}
              >
                <IconButton
                  onClick={() => setIsEditMode(true)}
                  sx={{
                    background: "none",
                    color: "white",
                    transition: "transform 0.3s, color 0.5s",
                    "&:hover": {
                      background: "none",
                      transform: "scale(1.2)",
                      color: "var(--accent)",
                    },
                  }}
                >
                  <Edit fontSize="large" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip
              title={isCreator ? "Delete Trip" : "Leave Trip"}
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.background.default,
                  },
                },
              }}
            >
              <IconButton
                onClick={() => setDeleteDialogOpen(true)}
                sx={{
                  background: "none",
                  color: "primary.main",
                  transition: "transform 0.3s, color 0.5s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "scale(1.2)",
                    background: "none",
                  },
                }}
              >
                {isCreator ? (
                  <Delete fontSize="large" />
                ) : (
                  <ExitToApp fontSize="large" />
                )}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      <Container sx={{ maxHeight: "100vh" }}>
        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={isCreator ? handleDelete : handleLeaveTrip}
          title={isCreator ? "Delete Trip" : "Leave Trip"}
          message={
            isCreator
              ? `Are you sure you want to delete "${tripData?.name}"?`
              : `Are you sure you want to leave "${tripData?.name}"? You can rejoin later if invited again.`
          }
        />

        <HeaderGrid container alignItems="center" theme={theme}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                {isEditMode ? (
                  <TextField
                    variant="standard"
                    required={true}
                    value={tripDetails.name}
                    error={!tripDetails.name}
                    placeholder="Trip Name"
                    slotProps={{
                      input: {
                        spellCheck: "false",
                        autoCorrect: "off",
                      },
                    }}
                    sx={{
                      width: "0.75",
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "2.5rem", md: "3.5rem" },
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "-1.5px",
                        color: "white",
                      },
                      "& .MuiFormHelperText-root": { color: "white" },
                      "& .MuiInput-underline:before": {
                        borderBottom: "1px solid white !important",
                      },
                      "& .MuiInput-underline:hover:before": {
                        borderBottom: "2px solid white !important",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottom: "2px solid white",
                      },
                      mb: 2,
                    }}
                    onChange={(e) =>
                      setTripDetails({ ...tripDetails, name: e.target.value })
                    }
                  />
                ) : (
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: "2.5rem", md: "3.5rem" },
                      fontWeight: 900,
                      lineHeight: 1.2,
                      letterSpacing: "-1.5px",
                      mb: 2,
                    }}
                  >
                    {tripData?.name || ""}
                  </Typography>
                )}
              </Box>
              <Box sx={{ mb: 1 }}>
                {isEditMode ? (
                  <TextField
                    variant="standard"
                    placeholder="Add a trip description"
                    value={tripDetails.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setTripDetails((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }
                    }}
                    helperText={`${tripDetails.description.length}/50`}
                    slotProps={{
                      input: {
                        spellCheck: "false",
                        autoCorrect: "off",
                      },
                    }}
                    sx={{
                      width: "0.62",
                      "& .MuiInputBase-input": {
                        color: "white",
                        fontSize: "1rem",
                      },
                      "& .MuiInput-underline:before": {
                        borderBottom: "1px solid white !important",
                      },
                      "& .MuiInput-underline:hover:before": {
                        borderBottom: "2px solid white !important",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottom: "2px solid white",
                      },
                      "& .MuiFormHelperText-root": { color: "white" },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      color: "white",
                      opacity: 0.7,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {tripDetails.description || "No description provided"}
                  </Typography>
                )}
              </Box>
              <Chip
                label={getTripStatus(tripData.startDate, tripData.endDate)}
                color="secondary"
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              />
            </Box>

            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <DateRange sx={{ fontSize: "2rem" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Departure Date
                    </Typography>
                    {isEditMode ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          disablePast
                          value={parseLocalDate(tripDetails.startDate)}
                          onChange={handleStartDateChange}
                          sx={{
                            width: "0.8",
                            "& .MuiInputBase-root": {
                              color: "white",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.5)",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "white",
                                },
                            },
                            "& .MuiInputBase-input": {
                              color: "white",
                              fontWeight: 700,
                              fontSize: "1.25rem",
                            },
                            "& .MuiSvgIcon-root": {
                              color: "white",
                            },
                          }}
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              fullWidth: true,
                              inputProps: {
                                sx: { color: "white" },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatDate(tripData?.startDate)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <FlightTakeoff sx={{ fontSize: "2rem" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Return Date
                    </Typography>
                    {isEditMode ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          disablePast
                          minDate={
                            tripDetails.startDate
                              ? addDays(parseISO(tripDetails.startDate), 1)
                              : undefined
                          }
                          value={parseLocalDate(tripDetails.endDate)}
                          onChange={handleEndDateChange}
                          sx={{
                            width: "0.8",
                            "& .MuiInputBase-root": {
                              color: "white",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.5)",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "white",
                                },
                            },
                            "& .MuiInputBase-input": {
                              color: "white",
                              fontWeight: 700,
                              fontSize: "1.25rem",
                            },
                            "& .MuiSvgIcon-root": {
                              color: "white",
                            },
                          }}
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              fullWidth: true,
                              inputProps: {
                                sx: { color: "white" },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatDate(tripData?.endDate)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                alignItems: "center",
                gap: 3,
                [theme.breakpoints.down("md")]: {
                  justifyContent: "center",
                },
              }}
            >
              {isEditMode ? (
                <>
                  <TextField
                    variant="standard"
                    required={true}
                    error={!tripDetails.destination}
                    placeholder="Destination"
                    slotProps={{
                      input: {
                        spellCheck: "false",
                        autoCorrect: "off",
                      },
                    }}
                    value={tripDetails.destination}
                    onChange={handleDestinationChange}
                    inputRef={(el) => (inputRef.current = el)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover fieldset": { borderColor: "white" },
                        "&.Mui-focused fieldset": { borderColor: "white" },
                      },
                      "& .MuiInputBase-input": {
                        padding: "10px 14px",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        alignItems: "left",
                      },
                      "& .MuiInput-underline:before": {
                        borderBottom: "1px solid white !important",
                      },
                      "& .MuiInput-underline:hover:before": {
                        borderBottom: "2px solid white !important",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottom: "2px solid white",
                      },
                    }}
                  />
                  <Popper
                    open={suggestions.length > 0}
                    anchorEl={inputRef.current}
                    placement="bottom-start"
                    disablePortal
                    style={{ zIndex: 1300 }}
                    modifiers={[
                      {
                        name: "preventOverflow",
                        options: {
                          boundary: "window",
                        },
                      },
                      {
                        name: "flip",
                        options: {
                          fallbackPlacements: ["bottom-end", "top-start"],
                        },
                      },
                    ]}
                  >
                    <Paper
                      style={{ width: inputRef.current?.clientWidth || 300 }}
                    >
                      <List>
                        {suggestions.map((city, index) => (
                          <ListItemButton
                            key={index}
                            onClick={() => handleSelectCity(city)}
                          >
                            <ListItemText
                              primary={`${city.name}, ${city.country}`}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  </Popper>
                </>
              ) : (
                <LocationPill label={tripData?.destination || ""} />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                mt: { xs: 4, md: 0 },
                width: "100%",
                position: "relative",
                [theme.breakpoints.up("md")]: {
                  justifyContent: "flex-end",
                },
              }}
            >
              <BudgetDonut
                budget={tripData?.budget || 0}
                isEditMode={isEditMode}
                expenseSummary={tripData.expenseSummary}
                tripDetails={tripDetails}
                handleBudgetChange={handleBudgetChange}
                handleBudgetBlur={handleBudgetBlur}
                setTripDetails={setTripDetails}
              />
            </Box>
          </Grid>
        </HeaderGrid>
      </Container>
    </GradientHeader>
  );
}
