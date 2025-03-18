import React from "react";
import { Calendar, dateFnsLocalizer, SlotInfo } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useItineraryStore } from "@/stores/itinerary-store";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "../types";
import { Member } from "@/types";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: ItineraryEvent;
}

interface CalendarViewProps {
  selectedDate?: Date;
  onAdd: (eventData: CreateItineraryEvent) => void;
  onUpdate: (event: ItineraryEvent, payload: CreateItineraryEvent) => void;
  onDelete: (eventId: number) => void;
  onAddNote: (eventId: number, note: CreateNote) => void;
  onUpdateNote: (eventId: number, noteId: number, note: CreateNote) => void;
  onDeleteNote: (eventId: number, noteId: number) => void;
  onEventSelect?: (event: ItineraryEvent) => void;
  onAssignMembers: (eventId: number, userIds: string[]) => void;
  onUnAssignMembers: (eventId: number, userIds: string[]) => void;
  members: Member[];
  tripStart: string;
  tripEnd: string;
  loading?: boolean;
  error?: string | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  loading = false,
  error = null,
  members,
  tripStart,
  tripEnd,
  onAdd,
  onUpdate,
  onDelete,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAssignMembers,
  onUnAssignMembers,
  onEventSelect = () => {},
}) => {
  const { itineraryEvents } = useItineraryStore();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  const events: CalendarEvent[] = itineraryEvents.map(
    (evt: ItineraryEvent) => ({
      title: evt.title,
      start: new Date(evt.startTime),
      end: new Date(evt.endTime),
      allDay: false,
      resource: evt,
    })
  );

  return (
    <Box
      sx={{
        position: "relative",
        maxWidth: 800,
        mx: "auto",
        height: "60vh",
        p: 3,
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        selectable
        views={["month", "week", "day"]}
        defaultView="month"
      />
    </Box>
  );
};

export default CalendarView;
