import React, { useMemo, useState } from "react";
import {
  Box,
  useTheme,
  alpha,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "../types";
import { useItineraryStore } from "@/stores/itinerary-store";
import { useNotificationStore } from "@/stores/notification-store";
import EventModal from "../EventModal";
import { Member } from "@/types";
import { TimelineDot } from "./styled";
import { DateHeader } from "./DateHeader";
import EventCard from "./EventCard";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { Event } from "@mui/icons-material";

interface ListViewProps {
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
  isAdminOrCreator: boolean;
}

const ListView: React.FC<ListViewProps> = ({
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
  const theme = useTheme();
  const { setNotification } = useNotificationStore();
  const { itineraryEvents: events } = useItineraryStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const eventsByDate = useMemo(() => {
    const groups: Record<string, ItineraryEvent[]> = {};
    events.forEach((evt) => {
      const dateKey = new Date(evt.startTime).toLocaleDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(evt);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date,
        events: groups[date].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      }));
  }, [events]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    setNotification(error, "error");
    return null;
  }

  const handleDeleteEventRequest = (eventId: number) => {
    setConfirmOpen(true);
    setPendingDelete(eventId);
  };

  const handleDeleteEvent = () => {
    if (pendingDelete !== null) {
      onDelete(pendingDelete);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  return (
    <>
      {events.length > 0 ? (
        <Box
          sx={{
            position: "relative",
            maxWidth: 800,
            mx: "auto",
            p: 3,
          }}
        >
          <AnimatePresence>
            {eventsByDate.map((group) => (
              <Box key={group.date} sx={{ mb: 4 }}>
                <DateHeader date={group.date} />
                <Box
                  sx={{
                    position: "relative",
                    pl: 3,
                    borderLeft: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  {group.events.map((evt, index) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.4 }}
                    >
                      <TimelineDot />
                      <EventCard
                        event={evt}
                        expanded={false}
                        onEdit={setEditingEvent}
                        onDelete={handleDeleteEventRequest}
                        onClose={() => {}}
                        onAddNote={onAddNote}
                        onUpdateNote={onUpdateNote}
                        onDeleteNote={onDeleteNote}
                        members={members}
                        onAssignMembers={onAssignMembers}
                        onUnAssignMembers={onUnAssignMembers}
                        isAdminOrCreator={isAdminOrCreator}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            ))}
          </AnimatePresence>
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            mx: "auto",
            pt: 3,
          }}
        >
          <Paper
            sx={{
              p: 8,
              textAlign: "center",
              background: `linear-gradient(45deg, ${theme.palette.background.default} 30%, ${theme.palette.action.hover} 90%)`,
              borderRadius: 6,
            }}
          >
            <Event
              sx={{
                fontSize: 80,
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              {"No Scheduled Events Yet!"}
            </Typography>
          </Paper>
        </Box>
      )}

      <DeleteConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteEvent}
      />

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

export default ListView;
