"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  useTheme,
  CircularProgress,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import HotelIcon from "@mui/icons-material/Hotel";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PollIcon from "@mui/icons-material/Poll";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WorkIcon from "@mui/icons-material/Work";
import GroupIcon from "@mui/icons-material/Group";
import CalculateIcon from "@mui/icons-material/Calculate";

// Section Components
import Overview from "./sections/Overview/index";
import Dates from "./sections/Dates";
import Destinations from "./sections/Destinations";
import Stays from "./sections/Stays";
import Activities from "./sections/Activities";
import Polls from "./sections/Polls";
import Itinerary from "./sections/Itinerary";
import PackingList from "./sections/PackingList";
import TripMembers from "./sections/TripMembers/index";
import Expenses from "./sections/Expenses";

import Dock from "../../../components/blocks/Components/Dock/Dock";
import { useTripStore } from "@/stores/trip-store";

const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: <DashboardIcon fontSize="medium" />,
  },
  { id: "dates", label: "Dates", icon: <EventIcon fontSize="medium" /> },
  {
    id: "destinations",
    label: "Destinations",
    icon: <PlaceIcon fontSize="medium" />,
  },
  { id: "stays", label: "Stays", icon: <HotelIcon fontSize="medium" /> },
  {
    id: "expenses",
    label: "Expenses",
    icon: <CalculateIcon fontSize="medium" />,
  },
  {
    id: "activities",
    label: "Activities",
    icon: <DirectionsRunIcon fontSize="medium" />,
  },
  { id: "polls", label: "Polls", icon: <PollIcon fontSize="medium" /> },
  {
    id: "itinerary",
    label: "Itinerary",
    icon: <CalendarTodayIcon fontSize="medium" />,
  },
  {
    id: "packing",
    label: "Packing List",
    icon: <WorkIcon fontSize="medium" />,
  },
  {
    id: "members",
    label: "Members",
    icon: <GroupIcon fontSize="medium" />,
  },
];

export default function TripSummaryPage() {
  const params = useParams();
  const tripId = Number(params.tripId);
  const theme = useTheme();

  const { tripData, loading, error, fetchTripData } = useTripStore();

  const [activeSection, setActiveSection] = useState("overview");

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  useEffect(() => {
    if (tripId) fetchTripData(tripId);
  }, [tripId, fetchTripData]);

  //Just a loading screen
  if (loading) {
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

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 4,
        }}
      >
        <Typography
          variant="h2"
          color="error"
          sx={{
            fontWeight: "700",
            fontFamily: "apple-system",
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          zIndex: 1000,
          maxHeight: "180px",
          py: 4,
          width: "100vw",
          overflow: "hidden",
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(3px)",
          borderBottom: `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)"
          }`,
        }}
      >
        <Dock
          items={sections.map((section) => ({
            id: section.id,
            label: section.label,
            icon: section.icon,
            onClick: () => handleSectionChange(section.id),
          }))}
          baseItemSize={60}
          panelHeight={90}
          magnification={90}
          // convert activeSection into index
          activeIndex={sections.findIndex(
            (section) => section.id === activeSection
          )}
          isDarkMode={theme.palette.mode === "dark"}
          key={`dock-${tripData?.id}`}
        />
      </Box>

      <Container sx={{ flex: 1, mt: 20 }}>
        {activeSection === "overview" && (
          <Overview tripData={tripData} onSectionChange={handleSectionChange} />
        )}
        {activeSection === "dates" && <Dates />}
        {activeSection === "destinations" && <Destinations />}
        {activeSection === "stays" && <Stays />}
        {activeSection === "expenses" && tripData && (
          <Expenses
            tripId={tripData.id}
            tripName={tripData.name}
            budget={tripData.budget}
            imageUrl={tripData.imageUrl ?? null}
            expenses={tripData.expenses}
            members={tripData.members}
            tripData={tripData}
            expenseSummary={tripData.expenseSummary}
          />
        )}

        {activeSection === "activities" && <Activities />}
        {activeSection === "polls" && <Polls />}
        {activeSection === "itinerary" && <Itinerary />}
        {activeSection === "packing" && <PackingList />}
        {activeSection === "members" && <TripMembers tripData={tripData} />}
      </Container>
    </Box>
  );
}
