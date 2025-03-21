import {
  Box,
  Typography,
  useTheme,
  Container,
  Button,
  alpha,
} from "@mui/material";
import { GradientHeader } from "../Overview/styled";
import { useState } from "react";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "./types";
import CreateEventModal from "./EventModal";
import { useTripStore } from "@/stores/trip-store";
import apiClient from "@/utils/apiClient";
import { useNotificationStore } from "@/stores/notification-store";
import { useItineraryStore } from "@/stores/itinerary-store";
import ListView from "./ListView/ListView";
import { Add, CalendarMonth, ViewList } from "@mui/icons-material";
import CalendarView from "./CalendarView/CalendarView";
import { HeaderButton } from "../Polls/styled";
import { useUserStore } from "@/stores/user-store";
import { getUserInfo } from "@/utils/userHelper";

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
}: ItineraryProps) {
  const theme = useTheme();

  const { user } = useUserStore();
  const { tripData } = useTripStore();
  const { loading, error, fetchItineraryEvents } = useItineraryStore();

  const { setNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const userInfo = getUserInfo(user);
  const isAdminOrCreator = userInfo
    ? userInfo?.isCreator(tripData) || userInfo?.isAdmin(tripData)
    : false;

  const handleSaveEvent = async (eventData: CreateItineraryEvent) => {
    try {
      await apiClient.post(`/trips/${tripId}/itinerary-events`, eventData);

      setNotification("Successfully created new Itinerary Event!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to create new Itinerary Event. Please refresh and try again!",
        "error"
      );
      console.error("Error creating Itinerary Event:", error);
    }
  };

  const handleUpdateItineraryEvent = async (
    originalEvent: ItineraryEvent,
    payload: CreateItineraryEvent
  ) => {
    try {
      await apiClient.patch(
        `/trips/${tripId}/itinerary-events/${originalEvent.id}`,
        payload
      );

      setNotification("Updated Itinerary Event Successfully!!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to Update Itinerary Event. Please refresh and try again!",
        "error"
      );
      console.error("Error updating Itinerary Event:", error);
    }
  };

  const handleDeleteItineraryEvent = async (eventId: number) => {
    try {
      await apiClient.delete(`/trips/${tripId}/itinerary-events/${eventId}`);

      setNotification("Deleted Itinerary Event Successfully!!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to Delete Itinerary Event. Please refresh and try again!",
        "error"
      );
      console.error("Error deleting Itinerary Event:", error);
    }
  };

  const handleAddItineraryEventNote = async (
    eventId: number,
    note: CreateNote
  ) => {
    try {
      await apiClient.post(
        `/trips/${tripId}/itinerary-events/${eventId}/notes`,
        note
      );

      setNotification("Added new Note Successfully!!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to add new Note. Please refresh and try again!",
        "error"
      );
      console.error("Error adding Note:", error);
    }
  };

  const handleUpdateItineraryEventNote = async (
    eventId: number,
    noteId: number,
    note: CreateNote
  ) => {
    try {
      await apiClient.patch(
        `/trips/${tripId}/itinerary-events/${eventId}/notes/${noteId}`,
        note
      );

      setNotification("Updated Note Successfully!!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to Update Note. Please refresh and try again!",
        "error"
      );
      console.error("Error updating Note:", error);
    }
  };

  const handleDeleteItineraryEventNote = async (
    eventId: number,
    noteId: number
  ) => {
    try {
      await apiClient.delete(
        `/trips/${tripId}/itinerary-events/${eventId}/notes/${noteId}`
      );

      setNotification("Deleted Note Successfully!!", "success");
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to Delete Note. Please refresh and try again!",
        "error"
      );
      console.error("Error deleting Note:", error);
    }
  };

  const handleAssignMembers = async (eventId: number, userIds: string[]) => {
    try {
      await apiClient.post(
        `/trips/${tripId}/itinerary-events/${eventId}/assign`,
        { userIds }
      );

      setNotification(
        "Assigned new member(s) to event Successfully!!",
        "success"
      );
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to assign new member. Please refresh and try again!",
        "error"
      );
      console.error("Error assigning new Member:", error);
    }
  };

  const handleDeleteAssignedMembers = async (
    eventId: number,
    userIds: string[]
  ) => {
    try {
      await apiClient.delete(
        `/trips/${tripId}/itinerary-events/${eventId}/unassign`,
        { data: { userIds } }
      );

      setNotification(
        "Un-assigned member Successfully from the event!!",
        "success"
      );
      // replenish our store
      await fetchItineraryEvents(tripId);
    } catch (error) {
      setNotification(
        "Failed to un-assign member. Please refresh and try again!",
        "error"
      );
      console.error("Error un-assigning member from the event:", error);
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
            <HeaderButton
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenModal}
              sx={{
                ml: "auto",
                [theme.breakpoints.down("sm")]: {
                  ml: 0,
                  order: 1,
                },
              }}
            >
              Create New Event
            </HeaderButton>
          </Box>
        </Container>
      </GradientHeader>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              bgcolor: alpha(theme.palette.background.paper, 0.4),
              borderRadius: "12px",
              p: 0.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: theme.shadows[1],
            }}
          >
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "contained" : "text"}
              sx={{
                minWidth: 120,
                borderRadius: "8px",
                textTransform: "none",
                color:
                  viewMode === "list"
                    ? theme.palette.primary.contrastText
                    : "text.secondary",
                bgcolor:
                  viewMode === "list"
                    ? theme.palette.primary.main
                    : "transparent",
                "&:hover": {
                  bgcolor:
                    viewMode === "list"
                      ? theme.palette.primary.dark
                      : alpha(theme.palette.primary.light, 0.1),
                },
              }}
              startIcon={<ViewList />}
            >
              List View
            </Button>
            <Button
              onClick={() => setViewMode("calendar")}
              variant={viewMode === "calendar" ? "contained" : "text"}
              sx={{
                minWidth: 120,
                borderRadius: "8px",
                textTransform: "none",
                color:
                  viewMode === "calendar"
                    ? theme.palette.primary.contrastText
                    : "text.secondary",
                bgcolor:
                  viewMode === "calendar"
                    ? theme.palette.primary.main
                    : "transparent",
                "&:hover": {
                  bgcolor:
                    viewMode === "calendar"
                      ? theme.palette.primary.dark
                      : alpha(theme.palette.primary.light, 0.1),
                },
              }}
              startIcon={<CalendarMonth />}
            >
              Calendar
            </Button>
          </Box>
        </Box>

        {viewMode === "list" ? (
          <ListView
            loading={loading}
            error={error}
            members={tripData?.members}
            tripStart={tripData?.startDate}
            tripEnd={tripData?.endDate}
            onAdd={handleSaveEvent}
            onUpdate={handleUpdateItineraryEvent}
            onDelete={handleDeleteItineraryEvent}
            onAddNote={handleAddItineraryEventNote}
            onUpdateNote={handleUpdateItineraryEventNote}
            onDeleteNote={handleDeleteItineraryEventNote}
            onAssignMembers={handleAssignMembers}
            onUnAssignMembers={handleDeleteAssignedMembers}
            isAdminOrCreator={isAdminOrCreator}
          />
        ) : (
          <CalendarView
            loading={loading}
            error={error}
            members={tripData?.members}
            tripStart={tripData?.startDate}
            tripEnd={tripData?.endDate}
            onAdd={handleSaveEvent}
            onUpdate={handleUpdateItineraryEvent}
            onDelete={handleDeleteItineraryEvent}
            onAddNote={handleAddItineraryEventNote}
            onUpdateNote={handleUpdateItineraryEventNote}
            onDeleteNote={handleDeleteItineraryEventNote}
            onAssignMembers={handleAssignMembers}
            onUnAssignMembers={handleDeleteAssignedMembers}
            isAdminOrCreator={isAdminOrCreator}
          />
        )}
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
