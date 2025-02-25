"use client";

import { useState, useEffect } from "react";
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
  InputAdornment,
  Alert,
  Snackbar,
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
} from "@mui/icons-material";
import { motion, useTransform, useScroll } from "framer-motion";
import styled from "@emotion/styled";

import { format, parseISO } from "date-fns";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import axios from "axios";
import apiClient from "@/utils/apiClient";

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
}

interface TripOverviewProps {
  tripData: TripData | null;
  onSectionChange: (sectionId: string) => void;
}

interface TripHeaderProps {
  tripData: TripData | null;
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

const GradientHeader = styled(Box)<{ theme: Theme }>(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
  [theme.breakpoints.down("md")]: {
  },
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
      color='secondary'
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
        <Typography variant='h5' gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip
          label={status}
          color='secondary'
          size='medium'
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
        <PollIcon color='primary' />
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {question}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {votes} votes received
          </Typography>
        </Box>
      </Box>
    </Paper>
  </motion.div>
);

function TripHeader ({ tripData }: TripHeaderProps) {
  const theme = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tripDetails, setTripDetails] = useState<{
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    currency: string;
  }>({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "CAD",
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
      });
    }
  }, [tripData]);

  const BudgetRing = styled(motion.div)({
    position: "relative",
    width: 140,
    height: 140,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
    background: theme.palette.primary.main,
  });

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
      });
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    handleReset();
    setError(null);
  };

  const handleSave = async () => {
    // Validate inputs first
    if (!tripDetails.name.trim()) {
      setError("Trip name is required");
      return;
    }

    if (!tripDetails.startDate || !tripDetails.endDate) {
      setError("Start and end dates are required");
      return;
    }

    // Check if end date is after start date
    if (new Date(tripDetails.startDate) >= new Date(tripDetails.endDate)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: tripDetails.name.trim(),
        destination: tripDetails.destination.trim(),
        startDate: tripDetails.startDate,
        endDate: tripDetails.endDate,
        budget: tripDetails.budget ? parseFloat(tripDetails.budget) : 0,
      };

      // Make the PATCH request to update the trip
      await apiClient.patch(`/trips/${tripData?.id}`, payload);
      
      // Show success message
      setSuccessMessage("Trip details updated successfully");
      
      // Exit edit mode
      setIsEditMode(false);
      
      // You might want to refresh the trip data here by triggering a refetch
      // This depends on how your app manages data fetching
      // For example: refetchTripData();
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(`Error updating trip: ${error.response?.data?.message || 'Server error'}`);
        console.error("Axios error:", error.response?.status, error.response?.data);
      } else {
        setError("Unexpected error occurred");
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
    <GradientHeader theme={theme}>
      <Container sx={{ maxHeight: "100vh" }}>
        {/* Alert for error messages */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {/* Confirmation message */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
        
        <HeaderGrid container alignItems='center' theme={theme}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Box display='flex' alignItems='center' gap={2}>
                {isEditMode ? (
                  <TextField 
                    variant="standard"
                    required={true}
                    value={tripDetails.name}
                    error={!tripDetails.name}
                    helperText={!tripDetails.name ? "Trip name is required" : ""}
                    slotProps={{
                      input: {
                        spellCheck: "false",
                        autoCorrect: "off",
                      },
                    }}
                    sx={{
                      width: "0.9",
                      "& .MuiInputBase-input": { // Match Typography size
                        fontSize: { xs: "2.5rem", md: "3.5rem" }, 
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "-1.5px",
                      },
                      "& .MuiFormHelperText-root": { color: "purple" },
                      mb: 2,
                    }}
                    onChange={e => setTripDetails({ ...tripDetails, name: e.target.value })}
                  />
                ) : ( 
                <Typography
                  variant='h1'
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
                {isEditMode ? (
                  <Box display='flex' gap={1}>
                    <IconButton
                      onClick={handleCancel}
                      sx={{
                        background: "none",
                        color: "white",
                        transition: "transform 0.3s, color 0.5s",
                        "&:hover": {
                          background: "none",
                          transform: "scale(1.2)",
                          color: "#ffcccc", // Light red on hover
                        },
                      }}
                    >
                      <Close />
                    </IconButton>
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
                          color: "#ccffcc", // Light green on hover
                        },
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : <Save />}
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton
                    onClick={() => setIsEditMode(true)}
                    sx={{
                      background: "none",
                      color: "white",
                      transition: "transform 0.3s, color 0.5s",
                      "&:hover": {
                        background: "none",
                        transform: "scale(1.2)",
                      },
                    }}
                  >
                    <Edit />
                  </IconButton>
                )}
              </Box>
              <Chip
                label={getTripStatus(tripData.startDate, tripData.endDate)}
                color='secondary'
                sx={{
                  borderRadius: 2,
                  //   py: 1,
                  //   px: 2.5,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              />
            </Box>

            <Grid container spacing={1} alignItems='center'>
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
                    <Typography variant='h6' sx={{ fontWeight: 500 }}>
                      Departure Date
                    </Typography>
                    {isEditMode ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={tripDetails.startDate ? new Date(tripDetails.startDate) : null}
                          onChange={(newDate) => {
                            if (newDate) {
                              setTripDetails({
                                ...tripDetails,
                                startDate: newDate.toISOString(),
                              });
                            }
                          }}
                          sx={{
                            width: "100%",
                            "& .MuiInputBase-root": {
                              color: "white",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.5)",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
                              variant: "standard",
                              fullWidth: true,
                              inputProps: {
                                sx: { color: "white" },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : (
                      <Typography variant='h5' sx={{ fontWeight: 700 }}>
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
                    <Typography variant='h6' sx={{ fontWeight: 500 }}>
                      Return Date
                    </Typography>
                    {isEditMode ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={tripDetails.endDate ? new Date(tripDetails.endDate) : null}
                          onChange={(newDate) => {
                            if (newDate) {
                              setTripDetails({
                                ...tripDetails,
                                endDate: newDate.toISOString(),
                              });
                            }
                          }}
                          sx={{
                            width: "100%",
                            "& .MuiInputBase-root": {
                              color: "white",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.5)",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
                              variant: "filled",
                              fullWidth: true,
                              inputProps: {
                                sx: { color: "white" },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : (
                      <Typography variant='h5' sx={{ fontWeight: 700 }}>
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
                <TextField
                  variant="standard"
                  value={tripDetails.destination}
                  onChange={(e) => setTripDetails({...tripDetails, destination: e.target.value})}
                  placeholder="Enter destination"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                      "&:hover fieldset": { borderColor: "white" },
                      "&.Mui-focused fieldset": { borderColor: "white" },
                    },
                    "& .MuiInputBase-input": {
                      padding: "10px 14px",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    },
                  }}
                />
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
                // mb: { xs: 0, md: 0 },
                mt: { xs: 2, md: 0 },
              }}
            >
              <BudgetRing>
                <Box
                  sx={{
                    background: theme.palette.background.paper,
                    borderRadius: "50%",
                    width: "80%",
                    height: "80%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // boxShadow: theme.shadows[4],
                  }}
                >
                  <Box textAlign='center'>
                    {isEditMode ? (
                      <TextField
                        variant="standard"
                        type="text"
                        value={tripDetails.budget}
                        onChange={handleBudgetChange}
                        onBlur={handleBudgetBlur}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="h6" color="text.primary">$</Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          width: "80%",
                          "& .MuiInputBase-input": {
                            fontWeight: 700,
                            fontSize: { xs: "1.3rem", md: "1.7rem" },
                            textAlign: "center",
                          }
                        }}
                      />
                    ) : (
                      <Typography
                        variant='h4'
                        fontWeight={700}
                        color={theme.palette.text.primary}
                        sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}
                      >
                        ${tripData?.budget?.toLocaleString() || "0"}
                      </Typography>
                    )}
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }}
                    >
                      Total Budget
                    </Typography>
                  </Box>
                </Box>
              </BudgetRing>
            </Box>
          </Grid>
        </HeaderGrid>
      </Container>
    </GradientHeader>
  );
}

export default function TripOverview ({
  tripData,
  onSectionChange,
}: TripOverviewProps) {
  const theme = useTheme();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  const [polls] = useState([
    { id: "1", question: "Which activities should we prioritize?", votes: 3 },
    { id: "2", question: "Preferred departure time?", votes: 5 },
  ]);

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
      <Container maxWidth='xl' disableGutters>
        <TripHeader tripData={tripData} />

        <Container sx={{ pt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SectionContainer theme={theme}>
                <Box mb={3}>
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Work fontSize='large' />
                    Journey Essentials
                  </Typography>
                  <Typography variant='body1' color='text.secondary'>
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
                    variant='h4'
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Group fontSize='large' />
                    Travel Squad
                  </Typography>
                  <Typography variant='body1' color='text.secondary'>
                    {tripData?.members.length} adventurers joining the journey
                  </Typography>
                </Box>

                <Box display='flex' flexWrap='wrap' gap={3} mb={3}>
                  {tripData?.members.map((member, index) => (
                    <MemberAvatar key={index} member={member.role} />
                  ))}
                </Box>

                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='secondary'
                    startIcon={<GroupAdd />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      fontSize: "1.1rem",
                    }}
                    onClick={() => onSectionChange("members")}
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
                variant='h4'
                gutterBottom
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Calculate fontSize='large' />
                Expenses
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                {tripData.expenses.length} expenses
              </Typography>
            </Box>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                fullWidth
                variant='contained'
                color='secondary'
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
                variant='h4'
                gutterBottom
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <PollIcon fontSize='large' />
                Active Polls
              </Typography>
              <Typography variant='body1' color='text.secondary'>
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
            variant='body1'
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
