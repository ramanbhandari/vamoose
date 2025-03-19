import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "../types";
import { useItineraryStore } from "@/stores/itinerary-store";
import { useNotificationStore } from "@/stores/notification-store";
import { FloatingDialogSmall } from "../../Polls/styled";
import EventModal from "../EventModal";
import { Member } from "@/types";
import { TimelineDot } from "./styled";
import { DateHeader } from "./DateHeader";
import EventCard from "./EventCard";

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
}) => {
  const theme = useTheme();
  const { setNotification } = useNotificationStore();
  const { itineraryEvents: events } = useItineraryStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ItineraryEvent | null>(
    null
  );

  const [editingMembersEventId, setEditingMembersEventId] = useState<
    number | null
  >(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const handleMemberToggle = (memberId: string) => () => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSaveMembers = () => {
    if (!editingMembersEventId) return;

    const event = events.find((e) => e.id === editingMembersEventId);
    if (!event) return;

    const currentAssignedIds = event.assignedUsers.map((u) => u.user.id);
    const added = selectedMemberIds.filter(
      (id) => !currentAssignedIds.includes(id)
    );
    const removed = currentAssignedIds.filter(
      (id) => !selectedMemberIds.includes(id)
    );

    if (added.length > 0) onAssignMembers(editingMembersEventId, added);
    if (removed.length > 0) onUnAssignMembers(editingMembersEventId, removed);

    setEditingMembersEventId(null);
    setSelectedMemberIds([]);
  };

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

  const handleDeleteEvent = (eventId: number) => {
    onDelete(eventId);
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
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
                    onDelete={onDelete}
                    onClose={() => {}}
                    onAddNote={onAddNote}
                    onUpdateNote={onUpdateNote}
                    onDeleteNote={onDeleteNote}
                    members={members}
                    onAssignMembers={onAssignMembers}
                    onUnAssignMembers={onUnAssignMembers}
                  />
                </motion.div>
              ))}
            </Box>
          </Box>
        ))}
      </AnimatePresence>

      <FloatingDialogSmall
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle
          sx={{ p: 0, backgroundColor: theme.palette.background.default }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 3,
              pb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={600} color="text.primary">
              Delete Event
            </Typography>
            <IconButton onClick={() => setConfirmOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            px: 3,
            py: 0,
            pt: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="body1">
            Are you sure you want to delete this event?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => pendingDelete && handleDeleteEvent(pendingDelete.id)}
            sx={{ px: 3, borderRadius: "8px", fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </FloatingDialogSmall>

      <FloatingDialogSmall
        open={!!editingMembersEventId}
        onClose={() => setEditingMembersEventId(null)}
      >
        <DialogTitle
          sx={{ p: 0, backgroundColor: theme.palette.background.default }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 3,
              pb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={600} color="text.primary">
              Manage Participants
            </Typography>
            <IconButton
              onClick={() => setEditingMembersEventId(null)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            px: 3,
            py: 0,
            pt: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <List sx={{ width: "100%", maxWidth: 360 }}>
            {members.map((member) => (
              <ListItem key={member.userId} disablePadding>
                <ListItemButton
                  role={undefined}
                  onClick={handleMemberToggle(member.userId)}
                  dense
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedMemberIds.includes(member.userId)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={member.user.fullName || member.user.email}
                    primaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            backgroundColor: theme.palette.background.default,
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setEditingMembersEventId(null)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveMembers}
            sx={{ px: 3, borderRadius: "8px", fontWeight: 600 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </FloatingDialogSmall>

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
    </Box>
  );
};

export default ListView;
