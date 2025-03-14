import { Box, Typography, useTheme, Container, Button } from "@mui/material";
import { GradientHeader } from "../Overview/styled";
import { useState } from "react";
import { CreateItineraryEvent, ItineraryEvent } from "./types";
import CreateEventModal from "./EventModal";
import { useTripStore } from "@/stores/trip-store";
import apiClient from "@/utils/apiClient";
import { useNotificationStore } from "@/stores/notification-store";
import { useItineraryStore } from "@/stores/itinerary-store";

interface ItineraryProps {
  tripId: number;
  tripName: string;
  imageUrl?: string;
  itineraryEvents: ItineraryEvent[];
}

export default function Itinerary({
  tripId,
  tripName,
  imageUrl,
  itineraryEvents,
}: ItineraryProps) {
  const theme = useTheme();
  const { tripData } = useTripStore();
  const { fetchItineraryEvents } = useItineraryStore();
  console.log(itineraryEvents);

  const { setNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveEvent = async (eventData: CreateItineraryEvent) => {
    try {
      await apiClient.post(`/trips/${tripId}/itinerary-events`, eventData);

      setNotification("Successfully created new Itinerary Event!", "success");
      // replenish our store
      fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to create new Itinerary Event. Please refresh and try again!",
        "error"
      );
      console.error("Error creating Itinerary Event:", error);
    }
  };

  if (!tripData) return;
  return (
    <Box key={tripId}>
      <GradientHeader
        theme={theme}
        sx={{
          background: imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

          "&::after": imageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `url(${imageUrl}) center/cover no-repeat`,
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
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              {tripName}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpenModal}
            >
              Create Event
            </Button>
          </Box>
        </Container>
      </GradientHeader>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        ByteMates haven&apos;t gotten to implement this feature yet, please
        check back again!
      </Container>

      <CreateEventModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleSaveEvent}
        members={tripData?.members}
        tripStart={tripData?.startDate}
        tripEnd={tripData?.endDate}
      />
    </Box>
  );
}
