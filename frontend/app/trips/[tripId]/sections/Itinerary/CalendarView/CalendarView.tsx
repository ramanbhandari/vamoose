/**
 * @file CalendarView.tsx
 * @description A full-featured calendar view for itinerary events using React Big Calendar with drag-and-drop and resizing support.
 */

import React, { useEffect, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  DateLocalizer,
  SlotInfo,
  stringOrDate,
  Views,
} from "react-big-calendar";

import withDragAndDrop, {
  EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";

import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { useItineraryStore } from "@/stores/itinerary-store";
import { ItineraryEvent, CreateItineraryEvent, CreateNote } from "../types";
import { Member } from "@/types";

import CustomToolbar, { CalendarEvent } from "./Toolbar";
import EventCard from "../ListView/EventCard";
import CreateEventModal from "../EventModal";
import { useNotificationStore } from "@/stores/notification-store";
import DeleteConfirmationDialog from "../ListView/DeleteConfirmationDialog";
import { FloatingDialogSmall } from "../../Polls/styled";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
  eventTitle: string;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
  actionType: "move" | "resize";
}

const ConfirmationDialog = ({
  open,
  onClose,
  eventTitle,
  originalStart,
  originalEnd,
  newStart,
  newEnd,
  actionType,
}: ConfirmationDialogProps) => (
  <FloatingDialogSmall open={open} onClose={() => onClose(false)}>
    <Box
      sx={{
        background: "var(--background-paper)",
        p: 3,
        borderRadius: "12px",
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          mb: 2,
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        Confirm {actionType === "move" ? "Move" : "Resize"}
      </DialogTitle>

      <DialogContent sx={{ p: 0, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {actionType === "move"
            ? `Move "${eventTitle}" to:`
            : `Resize "${eventTitle}" to:`}
        </Typography>

        <Box
          sx={{
            background: "var(--background)",
            borderRadius: "8px",
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {format(newStart, "MMM d, yyyy @ h:mm a")}
            {" → "}
            {format(newEnd, "MMM d, yyyy @ h:mm a")}
          </Typography>
        </Box>

        <Typography variant="body2" color="textSecondary">
          Original time: {format(originalStart, "MMM d, yyyy @ h:mm a")} –{" "}
          {format(originalEnd, "MMM d, yyyy @ h:mm a")}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 0, gap: 1 }}>
        <Button
          onClick={() => onClose(false)}
          variant="outlined"
          sx={{
            color: "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": { borderColor: "var(--primary)" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onClose(true)}
          variant="contained"
          sx={{
            bgcolor: "var(--primary)",
            "&:hover": { bgcolor: "var(--primary-hover)" },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Box>
  </FloatingDialogSmall>
);

const locales = { "en-US": enUS };
const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

interface CalendarViewProps {
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
  isAdminOrCreator: boolean;
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
  isAdminOrCreator,
}) => {
  const { itineraryEvents } = useItineraryStore();
  const { setNotification } = useNotificationStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<
    "month" | "week" | "day" | "work_week" | "agenda"
  >(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<ItineraryEvent | null>(
    null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStart, setCreateStart] = useState<Date | null>(null);
  const [createEnd, setCreateEnd] = useState<Date | null>(null);

  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    event: ItineraryEvent;
    start: Date;
    end: Date;
    action: "move" | "resize";
  } | null>(null);

  // if itineraryEvents change and event is selected, replace with updated event
  useEffect(() => {
    if (selectedEvent) {
      const updatedEvent = itineraryEvents.find(
        (e) => e.id === selectedEvent.id
      );
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    }
  }, [itineraryEvents, selectedEvent]);

  const handleDeleteEvent = async () => {
    if (pendingDelete !== null) {
      try {
        await onDelete(pendingDelete);
        setSelectedEvent(null);
        setDeleteConfirmOpen(false);
        setPendingDelete(null);
      } catch (error) {
        console.error("Error deleting Itinerary Event:", error);
      }
    }
  };

  const handleDeleteEventRequest = (eventId: number) => {
    setDeleteConfirmOpen(true);
    setPendingDelete(eventId);
  };

  const calendarEvents: CalendarEvent[] = itineraryEvents.map((evt) => ({
    title: evt.title,
    start: new Date(evt.startTime),
    end: new Date(evt.endTime),
    allDay: false,
    resource: evt,
  }));

  const handleSelectEvent = (calEvent: CalendarEvent) => {
    setSelectedEvent(calEvent.resource);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setCreateStart(slotInfo.start);
    setCreateEnd(slotInfo.end);
    setIsCreateOpen(true);
  };

  const asDate = (input: stringOrDate): Date => {
    return input instanceof Date ? input : new Date(input);
  };

  const handleEventDrop = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    if (
      !event.resource ||
      (asDate(start).getTime() === event.start.getTime() &&
        asDate(end).getTime() === event.end.getTime())
    )
      return;

    const itineraryEvent = event.resource;
    const startDate = asDate(start);
    const endDate = asDate(end);

    setPendingChange({
      event: itineraryEvent,
      start: startDate,
      end: endDate,
      action: "move",
    });
    setConfirmationOpen(true);
  };

  const handleEventResize = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    if (
      !event.resource ||
      (asDate(start).getTime() === event.start.getTime() &&
        asDate(end).getTime() === event.end.getTime())
    )
      return;

    const itineraryEvent = event.resource;
    const startDate = asDate(start);
    const endDate = asDate(end);

    setPendingChange({
      event: itineraryEvent,
      start: startDate,
      end: endDate,
      action: "resize",
    });
    setConfirmationOpen(true);
  };

  const handleConfirmationClose = (confirmed: boolean) => {
    setConfirmationOpen(false);
    if (confirmed && pendingChange) {
      onUpdate(pendingChange.event, {
        title: pendingChange.event.title,
        category: pendingChange.event.category,
        startTime: pendingChange.start.toISOString(),
        endTime: pendingChange.end.toISOString(),
      });
    }
    setPendingChange(null);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreateStart(null);
    setCreateEnd(null);
  };

  const isWithinTripDates = (date: Date) => {
    const tripStartDate = new Date(tripStart);
    const tripEndDate = new Date(tripEnd);
    return date >= tripStartDate && date <= tripEndDate;
  };

  const isRangeWithinTripDates = (start: Date, end: Date) => {
    return isWithinTripDates(start) && isWithinTripDates(end);
  };

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

  return (
    <>
      <Box
        sx={{
          position: "relative",
          maxWidth: 800,
          mx: "auto",
          height: "80vh",
          pt: 3,
        }}
      >
        <DnDCalendar
          localizer={localizer}
          events={calendarEvents}
          date={currentDate}
          onNavigate={(newDate) => {
            setCurrentDate(newDate);
          }}
          view={currentView}
          onView={(view) => {
            setCurrentView(view);
          }}
          defaultView={Views.MONTH}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          selectable
          onSelectSlot={(slotInfo: SlotInfo) => {
            if (!isRangeWithinTripDates(slotInfo.start, slotInfo.end)) {
              setNotification(
                "Cannot create events outside trip dates",
                "error"
              );
              return;
            }
            handleSelectSlot(slotInfo);
          }}
          onSelectEvent={handleSelectEvent}
          resizable
          onEventDrop={(args: EventInteractionArgs<CalendarEvent>) => {
            if (!isRangeWithinTripDates(asDate(args.start), asDate(args.end))) {
              setNotification("Cannot move events outside trip dates", "error");
              return;
            }
            handleEventDrop(args);
          }}
          onEventResize={(args: EventInteractionArgs<CalendarEvent>) => {
            if (!isRangeWithinTripDates(asDate(args.start), asDate(args.end))) {
              setNotification(
                "Cannot resize events outside trip dates",
                "error"
              );
              return;
            }
            handleEventResize(args);
          }}
          components={{
            toolbar: CustomToolbar,
          }}
        />
      </Box>

      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        fullWidth
        maxWidth="md"
      >
        {selectedEvent && (
          <EventCard
            event={selectedEvent}
            onEdit={setEditingEvent}
            onDelete={handleDeleteEventRequest}
            onClose={() => setSelectedEvent(null)}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            members={members}
            onAssignMembers={onAssignMembers}
            onUnAssignMembers={onUnAssignMembers}
            isAdminOrCreator={isAdminOrCreator}
            expanded
            calendarMode
          />
        )}
      </Dialog>

      {editingEvent && (
        <CreateEventModal
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

      <CreateEventModal
        open={isCreateOpen}
        onClose={closeCreateModal}
        onCreate={onAdd}
        members={members}
        tripStart={tripStart}
        tripEnd={tripEnd}
        initialStartTime={createStart ?? undefined}
        initialEndTime={createEnd ?? undefined}
      />

      <ConfirmationDialog
        open={confirmationOpen}
        onClose={handleConfirmationClose}
        eventTitle={pendingChange?.event.title || ""}
        originalStart={new Date(pendingChange?.event.startTime || 0)}
        originalEnd={new Date(pendingChange?.event.endTime || 0)}
        newStart={pendingChange?.start || new Date()}
        newEnd={pendingChange?.end || new Date()}
        actionType={pendingChange?.action || "move"}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteEvent}
      />
    </>
  );
};

export default CalendarView;
