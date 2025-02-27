"use client";

import { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Theme,
  Typography,
  useTheme,
  CircularProgress,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  Popper,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";

import {
  Hotel,
  GroupAdd,
  Explore,
  DateRange,
  Luggage,
  FlightTakeoff,
  FlightLand,
  Poll as PollIcon,
  Work,
  Group,
  Calculate,
  Close,
  Save,
  Edit as Edit,
  Delete,
  ExitToApp,
} from "@mui/icons-material";
import { motion, useTransform, useScroll } from "framer-motion";
import styled from "@emotion/styled";

import { format, parseISO } from "date-fns";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import axios from "axios";
import apiClient from "@/utils/apiClient";
import { useSearchParams, useRouter } from "next/navigation";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import BudgetDonut from "@/components/trips/Overview/BudgetDonut";
import { getUserInfo } from "@/app/util/userHelper";

import { formatISO } from "date-fns";
import { User } from "@supabase/supabase-js";
const formatDate = (dateString?: string) => {
  if (!dateString) return "No date provided";

  const date = parseISO(dateString); // Convert string to Date
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // Adjust for timezone

  return format(localDate, "MMM dd, yyyy"); // Format to "Feb 22, 2025"
};

interface TripData {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Array<{ tripId: number; userId: string; role: string }>;
  expenses: Array<[]>;
  stays: Array<[]>;
  imageUrl: string;
  description: string;
}

interface TripOverviewProps {
  tripData: TripData | null;
  onSectionChange: (sectionId: string) => void;
  currentUser: User | null;
}

interface TripHeaderProps {
  tripData: TripData | null;
  currentUser: User | null;
}

interface AdventureCardProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  onClick?: () => void;
}

interface PollProps {
  id: string;
  question: string;
  votes: number;
  onClick?: () => void;
}

interface ApiResponse {
  features: {
    properties: {
      name: string;
      country: string;
    };
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }[];
}

interface CitySuggestion {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const GradientHeader = styled(Box)<{ theme: Theme }>(({}) => ({
  padding: "3rem 2rem",
  color: "white",
  borderRadius: "0 0 80px 80px",
  position: "relative",
  overflow: "hidden",
  "&:before": {
    content: '""',
    position: "absolute",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
  },
}));

const HeaderGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  [theme.breakpoints.down("md")]: {},
}));

const SectionContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: theme.shadows[4],
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

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

const MemberAvatar = ({ member }: { member: string }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Avatar
      sx={{
        width: 72,
        height: 72,
        fontSize: "1.5rem",
        fontWeight: 700,
        boxShadow: 3,
        border: "2px solid white",
      }}
    >
      {member}
    </Avatar>
  </motion.div>
);

const AdventureCard = ({
  icon,
  title,
  status,
  onClick,
}: AdventureCardProps) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        height: "100%",
        transition: "all 0.3s ease",
        cursor: "pointer",
        backgroundColor: "background.default",
        "&:hover": {
          boxShadow: 6,
        },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <IconButton
          sx={{
            mb: 2,
            fontSize: "2.5rem",
            color: "primary.main",
            bgcolor: "action.hover",
            borderRadius: 3,
          }}
        >
          {icon}
        </IconButton>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip
          label={status}
          color="secondary"
          size="medium"
          sx={{
            fontWeight: 600,
            px: 2,
            borderRadius: 2,
          }}
        />
      </Box>
    </Paper>
  </motion.div>
);

const PollPreviewCard = ({ question, votes, onClick }: PollProps) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        transition: "all 0.3s ease",
        cursor: "pointer",
        backgroundColor: "background.default",
        "&:hover": {
          boxShadow: 6,
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <PollIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {question}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {votes} votes received
          </Typography>
        </Box>
      </Box>
    </Paper>
  </motion.div>
);

function TripHeader({ tripData, currentUser }: TripHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);

  const [tripDetails, setTripDetails] = useState<{
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    currency: string;
    description: string;
  }>({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "CAD",
    description: "",
  });

  // Initialize form with trip data when component mounts or tripData changes
  useEffect(() => {
    if (tripData) {
      setTripDetails({
        name: tripData.name || "",
        destination: tripData.destination || "",
        startDate: tripData.startDate || "",
        endDate: tripData.endDate || "",
        budget: tripData.budget?.toString() || "",
        currency: "CAD",
        description: tripData.description || "",
      });
    }
  }, [tripData]);

  // Check for edit parameter in URL when component mounts
  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (editParam === "true") {
      setIsEditMode(true);
    }
  }, [searchParams]);

  const getTripStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) return "Upcoming"; // If today is before the start date
    if (today >= start && today <= end) return "Current"; // If today is within the trip dates
    return "Past"; // If today is after the end date
  };

  const handleReset = () => {
    // Handle possible null tripData
    if (tripData) {
      setTripDetails({
        name: tripData.name || "",
        destination: tripData.destination || "",
        startDate: tripData.startDate || "",
        endDate: tripData.endDate || "",
        budget: tripData.budget?.toString() || "",
        currency: "CAD",
        description: tripData.description || "",
      });
    }
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
    setErrors([]);
  };

  const handleSave = async () => {
    // Reset any existing errors
    setErrors([]);

    // Collect all validation errors
    const validationErrors = [];

    if (!tripDetails.name.trim()) {
      validationErrors.push("Trip name is required");
    }

    if (!tripDetails.destination.trim()) {
      validationErrors.push("Destination is required");
    }

    if (!tripDetails.startDate) {
      validationErrors.push("Start date is required");
    }

    if (!tripDetails.endDate) {
      validationErrors.push("End date is required");
    }

    if (!tripDetails.budget) {
      validationErrors.push("Budget is required");
    }

    //if end date is after start date
    if (
      tripDetails.startDate &&
      tripDetails.endDate &&
      new Date(tripDetails.startDate) >= new Date(tripDetails.endDate)
    ) {
      validationErrors.push("End date must be after start date");
    }

    // If there are any validation errors, stack em up
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: tripDetails.name.trim(),
        destination: tripDetails.destination.trim(),
        startDate: tripDetails.startDate,
        endDate: tripDetails.endDate,
        budget: tripDetails.budget ? parseFloat(tripDetails.budget) : 0,
        description: tripDetails.description,
      };

      await apiClient.patch(`/trips/${tripData?.id}`, payload);

      // Show success message
      setSuccessMessage("Trip details updated successfully!");
      setIsEditMode(false);

      window.location.href = `/trips/${tripData?.id}`;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrors([
          `Error updating trip: ${
            error.response?.data?.message || "Server error"
          }`,
        ]);
        console.error(
          "Axios error:",
          error.response?.status,
          error.response?.data
        );
      } else {
        setErrors(["Unexpected error occurred"]);
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/trips/${tripData?.id}`);
      setSuccessMessage("Trip deleted successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrors([
          `Error deleting trip: ${
            error.response?.data?.message || "Server error"
          }`,
        ]);
      } else {
        setErrors(["Unexpected error occurred while deleting trip"]);
      }
      console.error("Error deleting trip:", error);
    }
  };

  const userInfo = getUserInfo(currentUser);

  //console.log("userInfo", userInfo);

  const isCreator = userInfo?.isCreator(tripData);

  //console.log("isCreator", isCreator);

  const handleLeaveTrip = async () => {
    if (!isCreator) {
      try {
        await apiClient.delete(`/trips/${tripData?.id}/members/leave`);
        setSuccessMessage("Successfully left the trip!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message || "Unable to leave trip";
          setErrors([`Error leaving trip: ${message}`]);
          console.error("Axios error leaving trip:", error);
        } else {
          setErrors(["Unexpected error occurred while leaving trip"]);
          console.error("Unexpected error leaving trip:", error);
        }
      }
    } else {
      setErrors(["You cannot leave the trip because you are the creator."]);
    }
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

  const parseLocalDate = (dateString: string | null) => {
    if (!dateString) return null;

    const cleanDate = dateString.split("T")[0];
    const date = parseISO(cleanDate);

    const parsedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );

    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date parsed:", parsedDate);
      return null;
    }

    return parsedDate;
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
      const data: ApiResponse = await response.json();

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
            {isCreator && <Tooltip
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
            </Tooltip>}

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

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: 4,
            border: 2,
            borderColor: "success.main",
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbars */}
      {errors.map((error, index) => (
        <Snackbar
          key={index}
          open={true}
          autoHideDuration={2000}
          onClose={() =>
            setErrors((prev) => prev.filter((_, i) => i !== index))
          }
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          sx={{
            top: `${index * 60}px !important`,
          }}
        >
          <Alert
            onClose={() =>
              setErrors((prev) => prev.filter((_, i) => i !== index))
            }
            severity="error"
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              color: "text.primary",
              boxShadow: 4,
              border: 2,
              borderColor: "error.main",
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        </Snackbar>
      ))}

      <Container sx={{ maxHeight: "100vh" }}>
        <Box
          sx={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "90%",
            maxWidth: 600,
          }}
        >
          {errors.length > 0 && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                boxShadow: 4,
                bgcolor: "background.paper",
                color: "text.primary",
                fontWeight: "bold",
              }}
              onClose={() => {
                setErrors([]);
              }}
            >
              {errors.join(" • ")}
            </Alert>
          )}
        </Box>

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
                  //   py: 1,
                  //   px: 2.5,
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

export default function TripOverview({
  tripData,
  onSectionChange,
  currentUser,
}: TripOverviewProps) {
  const theme = useTheme();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  const [polls] = useState([
    { id: "1", question: "Which activities should we prioritize?", votes: 3 },
    { id: "2", question: "Preferred departure time?", votes: 5 },
  ]);

  const router = useRouter();

  const handleInviteClick = () => {
    router.replace(`/trips/${tripData?.id}?invite=true`);
    onSectionChange("members");
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
    <motion.div style={{ scale }}>
      <Container maxWidth="xl" disableGutters>
        <TripHeader tripData={tripData} currentUser={currentUser} />

        <Container sx={{ pt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SectionContainer theme={theme}>
                <Box mb={3}>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Work fontSize="large" />
                    Journey Essentials
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Key components of your upcoming adventure
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {[
                    {
                      id: "stays",
                      icon: <Hotel />,
                      title: "Stays",
                      status: `${
                        tripData?.stays ? tripData.stays.length : 0
                      } Booked`,
                    },
                    {
                      id: "activities",
                      icon: <Explore />,
                      title: "Activities",
                      status: "5 Planned",
                    },
                    {
                      id: "packing",
                      icon: <Luggage />,
                      title: "Packing List",
                      status: "In Progress",
                    },
                    {
                      id: "itinerary",
                      icon: <DateRange />,
                      title: "Itinerary",
                      status: "Draft",
                    },
                  ].map((item, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <AdventureCard
                        {...item}
                        onClick={() => onSectionChange(item.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </SectionContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionContainer theme={theme}>
                <Box mb={3}>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Group fontSize="large" />
                    Travel Squad
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {tripData?.members.length} adventurers joining the journey
                  </Typography>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
                  {tripData?.members.map((member, index) => (
                    <MemberAvatar key={index} member={member.role} />
                  ))}
                </Box>

                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<GroupAdd />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      fontSize: "1.1rem",
                    }}
                    onClick={handleInviteClick}
                  >
                    Invite More Explorers
                  </Button>
                </motion.div>
              </SectionContainer>
            </Grid>
          </Grid>
          <SectionContainer theme={theme}>
            <Box mb={3}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Calculate fontSize="large" />
                Expenses
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tripData.expenses.length} expenses
              </Typography>
            </Box>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
                onClick={() => onSectionChange("expenses")}
              >
                Manage Expenses
              </Button>
            </motion.div>
          </SectionContainer>

          <SectionContainer theme={theme}>
            <Box mb={3}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <PollIcon fontSize="large" />
                Active Polls
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {polls.length} ongoing decisions
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {polls.map((poll, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <PollPreviewCard
                    id={poll.id}
                    question={poll.question}
                    votes={poll.votes}
                    onClick={() => onSectionChange("polls")}
                  />
                </Grid>
              ))}
            </Grid>
          </SectionContainer>

          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: "text.secondary",
              textAlign: "center",
              maxWidth: 600,
              mx: "auto",
              lineHeight: 1.6,
              "&:before, &:after": {
                content: '"✈️"',
                mx: 1,
              },
            }}
          >
            {'"The journey of a thousand miles begins with a single step"'}
          </Typography>
        </Container>
      </Container>
    </motion.div>
  );
}
