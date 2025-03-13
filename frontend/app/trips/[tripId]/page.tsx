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
import HotelIcon from "@mui/icons-material/Hotel";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PollIcon from "@mui/icons-material/Poll";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WorkIcon from "@mui/icons-material/Work";
import GroupIcon from "@mui/icons-material/Group";
import CalculateIcon from "@mui/icons-material/Calculate";

// Section Components
import Overview from "./sections/Overview/index";
import Stays from "./sections/Stays/index";
import Activities from "./sections/Activities/index";
import Polls from "./sections/Polls/index";
import Itinerary from "./sections/Itinerary/index";
import PackingList from "./sections/PackingList/index";
import TripMembers from "./sections/TripMembers/index";
import Expenses from "./sections/Expenses";

import Dock from "../../../components/blocks/Components/Dock/Dock";
import { useTripStore } from "@/stores/trip-store";
import { usePollStore } from "@/stores/polls-store";
import { LocationOn } from "@mui/icons-material";
import Maps from "./sections/Maps";

const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: <DashboardIcon fontSize="medium" />,
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
  {
    id: "maps",
    label: "Maps",
    icon: <LocationOn fontSize="medium" />,
  },
];

export default function TripSummaryPage() {
  const params = useParams();
  const tripId = Number(params.tripId);
  const theme = useTheme();

  const { tripData, loading, error, fetchTripData } = useTripStore();
  const { activePolls, completedPolls, fetchPolls } = usePollStore();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  useEffect(() => {
    if (tripId) {
      fetchTripData(tripId);
      // silently also pull Polls
      fetchPolls(tripId);
    }

    // update section from hash
    const updateSectionFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveSection(hash);
        history.replaceState(null, "", window.location.pathname);
      }
    };

    updateSectionFromHash();

    // Listen for hash changes
    window.addEventListener("hashchange", updateSectionFromHash);

    // Listen for our custom event to update section if user was already on that trip page
    const handleSectionChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.section) {
        setActiveSection(customEvent.detail.section);
        // giving react some time before removing the hash otherwise it doesnt work
        setTimeout(() => {
          history.replaceState(null, "", window.location.pathname);
        }, 100);
      }
    };
    window.addEventListener("trip-section-change", handleSectionChange);

    return () => {
      window.removeEventListener("hashchange", updateSectionFromHash);
      window.removeEventListener("trip-section-change", handleSectionChange);
    };
  }, [tripId, fetchTripData, fetchPolls]);

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
        {activeSection === "stays" && tripData && (
          <Stays
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
          />
        )}
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

        {activeSection === "activities" && tripData && (
          <Activities
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
          />
        )}
        {activeSection === "polls" && tripData && (
          <Polls
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
            activePolls={activePolls}
            completedPolls={completedPolls}
            members={tripData.members}
          />
        )}
        {activeSection === "itinerary" && tripData && (
          <Itinerary
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
          />
        )}
        {activeSection === "packing" && tripData && (
          <PackingList
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
          />
        )}
        {activeSection === "members" && <TripMembers tripData={tripData} />}
        {activeSection === "maps" && tripData && (
          <Maps
            tripId={tripData.id}
            tripName={tripData.name}
            imageUrl={tripData.imageUrl ?? null}
          />
        )}
      </Container>
    </Box>
  );
}
