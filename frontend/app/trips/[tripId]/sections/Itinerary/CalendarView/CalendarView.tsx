import React, { useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
  DateLocalizer,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  useTheme,
} from "@mui/material";
import { useItineraryStore } from "@/stores/itinerary-store";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "../types";
import { Member } from "@/types";
import CustomToolbar, { CalendarEvent } from "./Toolbar";
import EventCard from "../ListView/EventCard";
import EventModal from "../EventModal";

const locales = { "en-US": enUS };

const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  selectedDate?: Date;
  onAdd: (eventData: CreateItineraryEvent) => void;
  onUpdate: (event: ItineraryEvent, payload: CreateItineraryEvent) => void;
  onDelete: (eventId: number) => void;
  onAddNote: (eventId: number, note: CreateNote) => void;
  onUpdateNote: (eventId: number, noteId: number, note: CreateNote) => void;
  onDeleteNote: (eventId: number, noteId: number) => void;
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
}) => {
  const theme = useTheme();
  const { itineraryEvents } = useItineraryStore();
  const [selectedEvent, setSelectedEvent] = useState<ItineraryEvent | null>(
    null
  );

  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);

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

  // Map itinerary events into the calendar's expected format
  const events: CalendarEvent[] = itineraryEvents.map(
    (evt: ItineraryEvent) => ({
      title: evt.title,
      start: new Date(evt.startTime),
      end: new Date(evt.endTime),
      allDay: false,
      resource: evt,
    })
  );

  // When an event is clicked, set the selected event
  const handleSelectEvent = (event: CalendarEvent): void => {
    setSelectedEvent(event.resource);
  };

  // When a slot is selected, prefill a new event
  const handleSelectSlot = (slotInfo: SlotInfo): void => {
    const newEvent: CreateItineraryEvent = {
      title: "",
      startTime: slotInfo.start.toISOString(),
      endTime: slotInfo.end.toISOString(),
      category: "GENERAL",
    };
    onAdd(newEvent);
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          maxWidth: 800,
          mx: "auto",
          height: "80vh",
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
          components={{
            toolbar: CustomToolbar,
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
        />
      </Box>

      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        fullWidth
        maxWidth="md"
        hideBackdrop
        slotProps={{
          paper: {
            sx: {
              backgroundColor: theme.palette.secondary.main,
              boxShadow: "none",
              px: 1,
            },
          },
        }}
      >
        {selectedEvent && (
          <EventCard
            event={selectedEvent}
            onEdit={setEditingEvent}
            onDelete={onDelete}
            onClose={() => setSelectedEvent(null)}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            members={members}
            onAssignMembers={onAssignMembers}
            onUnAssignMembers={onUnAssignMembers}
            expanded={true}
            calendarMode={true}
          />
        )}
      </Dialog>

      {editingEvent && (
        <EventModal
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onCreate={onAdd}
          onUpdate={(payload) => onUpdate(editingEvent, payload)}
          event={editingEvent}
          members={members}
          tripStart={tripStart}
          tripEnd={tripEnd}
        />
      )}
    </>
  );
};

export default CalendarView;
