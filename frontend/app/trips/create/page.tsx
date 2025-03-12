"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
  StepConnector,
  stepConnectorClasses,
  styled,
  SelectChangeEvent,
  Skeleton,
} from "@mui/material";

import axios from "axios";

import { formatISO, addDays, parseISO } from "date-fns";

import { MenuItem, Select, InputAdornment } from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import apiClient from "@/utils/apiClient";
import { Alert } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { IconButton } from "@mui/material";

import { StepIconProps } from "@mui/material/StepIcon";
import { FlightTakeoff, Event, CheckCircle } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";

import Image from "next/image";
import DestinationField from "./DestinationField";
import { useRouter } from "next/navigation";
import { useUserTripsStore } from "@/stores/user-trips-store";

const steps = [
  { label: "Trip Details", icon: <FlightTakeoff fontSize="large" /> },
  { label: "Select Dates", icon: <Event fontSize="large" /> },
  { label: "Review & Confirm", icon: <CheckCircle fontSize="large" /> },
];

const backgroundImage = "/dashboard/dashboard_15.jpg";

export default function CreateTrip() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { fetchUserTrips } = useUserTripsStore();

  const [activeStep, setActiveStep] = useState(0);
  const [tripDetails, setTripDetails] = useState<{
    name: string;
    description: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    currency: string;
  }>({
    name: "",
    description: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "CAD",
  });

  useEffect(() => {
    const preloadAssets = async () => {
      // following timeout is added purposely since there's a snap of black screen so we will show skeleton for timeout time
      await new Promise((res) => setTimeout(res, 1000));
      await preloadImage(backgroundImage);
      setLoading(false);
    };
    preloadAssets();
  }, []);

  const preloadImage = (url: string) => {
    return new Promise<void>((resolve) => {
      const img = new window.Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleNext = () => {
    const newErrors: { [key: string]: string } = {};

    if (activeStep === 0) {
      if (!tripDetails.name.trim()) newErrors.name = "Trip Name is required.";
      if (!tripDetails.destination.trim())
        newErrors.destination = "Destination is required.";
    }

    if (activeStep === 1) {
      if (!tripDetails.startDate)
        newErrors.startDate = "Start Date is required.";
      if (!tripDetails.endDate) newErrors.endDate = "End Date is required.";

      if (tripDetails.startDate && tripDetails.endDate) {
        if (new Date(tripDetails.startDate) >= new Date(tripDetails.endDate)) {
          newErrors.startDate = "Start Date must be before End Date.";
          newErrors.endDate = "End Date must be after Start Date.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError("Please fix the errors before proceeding.");
      return;
    }

    setErrors({});
    setGlobalError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleCreateTrip = async () => {
    setLoading(true);
    try {
      const cityName = tripDetails.destination.split(",")[0].trim();

      const wikiResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${cityName}&pithumbsize=600`
      );

      const pages = wikiResponse.data.query.pages;
      const firstPage = Object.keys(pages)[0];
      const wikiImage = pages[firstPage]?.thumbnail?.source;

      const payload = {
        name: tripDetails.name.trim(),
        description: tripDetails.description.trim(),
        destination: tripDetails.destination.trim(),
        startDate: tripDetails.startDate,
        endDate: tripDetails.endDate,
        budget: tripDetails.budget ? parseFloat(tripDetails.budget) : 0,
        imageUrl: wikiImage ?? null,
      };

      const response = await apiClient.post("/trips", payload);

      if (response.data.trip.id) {
        setActiveStep(steps.length);
        // create new success should pull user upcoming trips to replenish our user trips store for keeping our chat list updated
        fetchUserTrips("upcoming");
        router.push(`/trips/${response.data.trip.id}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios error:",
          error.response?.status,
          error.response?.data
        );
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTripDetails({
      name: "",
      description: "",
      destination: "",
      startDate: "",
      endDate: "",
      budget: "",
      currency: "CAD",
    });
    setActiveStep(0); // Go back to Step 1
    setErrors({});
    setGlobalError(null);
  };

  const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
      top: 10,
    },
    [`&.${stepConnectorClasses.active}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.primary.main,
      },
    },
    [`&.${stepConnectorClasses.completed}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.primary.main,
      },
    },
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.divider,
      borderTopWidth: 1,
      borderRadius: 1,
    },
  }));

  const CustomStepIcon = (props: StepIconProps) => {
    const { active, completed, icon } = props;
    const theme = useTheme();

    const icons: { [index: string]: React.ReactElement } = {
      1: <FlightTakeoff fontSize="large" />,
      2: <Event fontSize="large" />,
      3: <CheckCircle fontSize="large" />,
    };

    return (
      <Box
        sx={{
          width: 45,
          height: 45,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "50%",
          backgroundColor: completed
            ? theme.palette.primary.main
            : active
              ? theme.palette.primary.light
              : theme.palette.background.paper,
          color: completed
            ? "white"
            : active
              ? "black"
              : theme.palette.text.secondary,
          transition: "all 0.3s ease",
          boxShadow: active ? `0 0 2px ${theme.palette.primary.main}` : "none",
        }}
      >
        {icons[String(icon)]}
      </Box>
    );
  };

  const handleStartDateChange = (newValue: Date | null) => {
    if (newValue) {
      const formattedDate = formatISO(newValue, { representation: "date" });

      setTripDetails({ ...tripDetails, startDate: formattedDate });

      // Clear error if valid
      setErrors((prev) => ({ ...prev, startDate: "" }));
      setGlobalError(null);
    } else {
      setErrors((prev) => ({ ...prev, startDate: "Start Date is required." }));
    }
  };

  const handleEndDateChange = (newValue: Date | null) => {
    if (newValue) {
      const formattedDate = formatISO(newValue, { representation: "date" });

      if (
        tripDetails.startDate &&
        new Date(formattedDate) <= new Date(tripDetails.startDate)
      ) {
        setErrors((prev) => ({
          ...prev,
          endDate: "End Date must be after Start Date.",
        }));
      } else {
        setTripDetails({ ...tripDetails, endDate: formattedDate });

        // Clear error if valid
        setErrors((prev) => ({ ...prev, endDate: "" }));
        setGlobalError(null);
      }
    } else {
      setErrors((prev) => ({ ...prev, endDate: "End Date is required." }));
    }
  };

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");

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

  const handleCurrencyChange = (event: SelectChangeEvent) => {
    setTripDetails({ ...tripDetails, currency: event.target.value });
  };
  // if its loading, show skeleton resembling the page closely
  if (loading) {
    return (
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          p: 2,
        }}
      >
        <Grid
          container
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            minHeight: "calc(100vh - 64px)",
            alignItems: "center",
            justifyContent: "center",
          }}
          spacing={4}
        >
          <Grid item xs={12} md={5} lg={4} sx={{ pt: 2 }}>
            <Box
              sx={{
                textAlign: { xs: "center", md: "left" },
                paddingTop: "env(safe-area-inset-top, 20px)",
                marginTop: "70px",
              }}
            >
              <Skeleton variant="text" width="60%" height={50} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mt: 2 }} />
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            lg={5}
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              marginTop: "70px",
            }}
          >
            <Card
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "550px",
                boxShadow: 6,
                borderRadius: "12px",
                bgcolor: "background.paper",
                p: { xs: 2, sm: 4 },
              }}
            >
              <CardContent>
                <Skeleton variant="text" width="80%" height={40} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  {steps.map((_, index) => (
                    <Skeleton
                      key={index}
                      variant="circular"
                      width={40}
                      height={40}
                    />
                  ))}
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={50}
                    sx={{ mt: 2, borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={50}
                    sx={{ mt: 2, borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={50}
                    sx={{ mt: 2, borderRadius: 2 }}
                  />
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3 }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={50}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={50}
                    sx={{ borderRadius: 2 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="45%"
                    height={50}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="45%"
                    height={50}
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        p: 2,
      }}
    >
      <Image
        //src="https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        src="/dashboard/dashboard_15.jpg"
        alt="Travel Background"
        layout="fill"
        objectFit="cover"
        style={{ filter: "brightness(0.7)" }}
      />

      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          minHeight: "100vh",
          background:
            "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 25%, transparent 50%)",
          zIndex: 1,
        }}
      />

      <Grid
        container
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          alignItems: "center",
          justifyContent: "center",
        }}
        spacing={4}
      >
        <Grid item xs={12} md={5} lg={4} sx={{ pt: 2 }}>
          <Box
            sx={{
              textAlign: { xs: "center", md: "left" },
              color: "white",
              paddingTop: isMobile ? "env(safe-area-inset-top, 20px)" : 0,
              marginTop: isMobile ? "60px" : "70px",
            }}
          >
            <Typography
              variant={isMobile ? "h4" : "h3"}
              sx={{
                fontWeight: 700,
                mb: 2,
                whiteSpace: "normal",
                wordWrap: "break-word",
                textShadow: "3px 3px 8px rgba(0,0,0,0.7)",
              }}
            >
              ✈️ Create Your Perfect Trip
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: isMobile ? "1rem" : "1.25rem",
                mx: { xs: "auto", md: 0 },
                maxWidth: "100%",
                textShadow: "3px 3px 8px rgba(0,0,0,0.7)",
              }}
            >
              Plan your dream journey with ease. Select your destination, dates,
              and budget!
            </Typography>
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          lg={5}
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginTop: isMobile ? "0px" : "70px",
          }}
        >
          <Card
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: "550px",
              boxShadow: 6,
              borderRadius: "12px",
              bgcolor: "background.paper",
              p: { xs: 2, sm: 4 },
            }}
          >
            <Tooltip title="Restart" arrow>
              <IconButton
                onClick={handleReset}
                sx={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <RestartAltIcon fontSize="medium" />
              </IconButton>
            </Tooltip>

            <CardContent>
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                connector={<CustomStepConnector />}
              >
                {steps.map((step, index) => (
                  <Step key={index} completed={activeStep > index}>
                    <StepLabel slots={{ stepIcon: CustomStepIcon }}>
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4 }}>
                {activeStep === 0 && (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                      Enter Your Trip Details
                    </Typography>

                    {globalError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {globalError}
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      label="Trip Name"
                      margin="normal"
                      required
                      value={tripDetails.name}
                      onChange={(e) => {
                        setTripDetails({
                          ...tripDetails,
                          name: e.target.value,
                        });
                        if (e.target.value.trim()) {
                          setErrors((prev) => ({ ...prev, name: "" }));
                          setGlobalError(null);
                        }
                      }}
                      error={!!errors.name}
                      helperText={errors.name}
                    />
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      multiline
                      rows={3}
                      margin="normal"
                      value={tripDetails.description}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          description: e.target.value,
                        })
                      }
                    />
                    <DestinationField
                      tripDetails={tripDetails}
                      setTripDetails={setTripDetails}
                      errors={errors}
                      setErrors={setErrors}
                      setGlobalError={setGlobalError}
                    />
                  </>
                )}

                {activeStep === 1 && (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                      Select Trip Dates & Budget
                    </Typography>
                    {globalError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {globalError}
                      </Alert>
                    )}

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date*"
                        disablePast
                        value={
                          tripDetails.startDate
                            ? parseLocalDate(tripDetails.startDate)
                            : null
                        }
                        onChange={handleStartDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: "normal",
                            error: !!errors.startDate,
                            helperText: errors.startDate,
                          },
                        }}
                      />

                      <DatePicker
                        label="End Date*"
                        minDate={
                          tripDetails.startDate
                            ? addDays(parseISO(tripDetails.startDate), 1)
                            : undefined
                        }
                        disablePast
                        value={
                          tripDetails.endDate
                            ? parseLocalDate(tripDetails.endDate)
                            : null
                        }
                        onChange={handleEndDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: "normal",
                            error: !!errors.endDate,
                            helperText: errors.endDate,
                          },
                        }}
                      />
                    </LocalizationProvider>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      <Select
                        value={tripDetails.currency}
                        onChange={handleCurrencyChange}
                        size="small"
                        sx={{ minWidth: 80 }}
                      >
                        <MenuItem value="CAD">CAD</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="INR">INR</MenuItem>
                      </Select>

                      <TextField
                        fullWidth
                        label="Budget"
                        value={tripDetails.budget}
                        onChange={handleBudgetChange}
                        onBlur={handleBudgetBlur}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: tripDetails.currency,
                              })
                                .format(0)
                                .replace(/\d/g, "")
                                .trim()}
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </>
                )}

                {activeStep === 2 && (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                      Review Your Trip Details
                    </Typography>
                    <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {tripDetails.name || "No Name Provided"}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", mb: 1 }}>
                        {tripDetails.destination || "No Destination Set"}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography>
                        <strong>🗓 Start Date:</strong>{" "}
                        {tripDetails.startDate || "Not Set"}
                      </Typography>
                      <Typography>
                        <strong>🏁 End Date:</strong>{" "}
                        {tripDetails.endDate || "Not Set"}
                      </Typography>
                      <Typography>
                        <strong>💰 Budget:</strong>{" "}
                        {tripDetails.budget
                          ? `${tripDetails.currency} ${tripDetails.budget}`
                          : "N/A"}
                      </Typography>
                    </Paper>
                  </>
                )}
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
              >
                {activeStep != steps.length && (
                  <>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={
                        activeStep === steps.length - 1
                          ? handleCreateTrip
                          : handleNext
                      }
                      disabled={
                        Object.values(errors).some((error) => error) ||
                        globalError !== null
                      }
                    >
                      {activeStep === steps.length - 1 ? "Finish" : "Next"}
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
