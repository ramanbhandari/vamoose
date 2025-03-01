"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  Container,
  CircularProgress,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { useState } from "react";

import { TripData } from "@/types";
import { useTripStore } from "@/stores/trip-store";
import TripHeader from "./TripHeader";
import JourneyEssentials from "./JourneyEssentials";
import TravelSquad from "./TravelSquad";
import ExpensesSection from "./ExpensesSection";
import PollsSection from "./PollsSection";
import { useRouter } from "next/navigation";

interface TripOverviewProps {
  tripData: TripData | null;
  onSectionChange: (sectionId: string) => void;
}

export default function TripOverview({
  tripData: initialTripData,
  onSectionChange,
}: TripOverviewProps) {
  const router = useRouter();
  // fetch tripData from our store if it exists, else use the props
  const { tripData: tripDataStore } = useTripStore();
  const tripData = tripDataStore || initialTripData;

  const [polls] = useState([
    { id: "1", question: "Which activities should we prioritize?", votes: 3 },
    { id: "2", question: "Preferred departure time?", votes: 5 },
  ]);

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

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

  const handleInviteClick = () => {
    router.replace(`/trips/${tripData?.id}?invite=true`);
    onSectionChange("members");
  };

  return (
    <motion.div style={{ scale }}>
      <Container maxWidth="xl" disableGutters>
        <TripHeader tripData={tripData} />

        <Container sx={{ pt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <JourneyEssentials onSectionChange={onSectionChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TravelSquad
                members={tripData.members}
                onInvite={handleInviteClick}
              />
            </Grid>
          </Grid>
          <ExpensesSection
            expenses={tripData.expenses}
            onSectionChange={onSectionChange}
          />
          <PollsSection polls={polls} onSectionChange={onSectionChange} />

          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: "text.secondary",
              textAlign: "center",
              maxWidth: 600,
              mt: 4,
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
