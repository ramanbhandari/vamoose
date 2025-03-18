import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  Avatar,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import {
  ExpandMore,
  LocationOn,
  Schedule,
  Restaurant,
  Hiking,
  Flight,
  Group,
  Note,
  Close,
  DeleteOutline,
  Edit,
  Check,
  Add,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { CreateItineraryEvent, CreateNote, ItineraryEvent } from "../types";
import { useItineraryStore } from "@/stores/itinerary-store";
import { useNotificationStore } from "@/stores/notification-store";
import { FloatingDialogSmall } from "../../Polls/styled";
import EventModal from "../EventModal";
import { Member } from "@/types";
import { StyledEventCard, TimelineDot } from "./styled";
import { DateHeader } from "./DateHeader";

const CategoryIcon = {
  MEAL: <Restaurant fontSize="small" />,
  ACTIVITY: <Hiking fontSize="small" />,
  TRAVEL: <Flight fontSize="small" />,
  MEETING: <Group fontSize="small" />,
  GENERAL: <Schedule fontSize="small" />,
  FREE_TIME: <Schedule fontSize="small" />,
  OTHER: <Note fontSize="small" />,
};

interface ListViewProps {
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
  onEventSelect = () => {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { setNotification } = useNotificationStore();
  const { itineraryEvents: events } = useItineraryStore();
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ItineraryEvent | null>(
    null
  );

  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);

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

  const toggleEventExpansion = (eventId: number) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

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
                  <StyledEventCard>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Box
                        sx={{ flexGrow: 1 }}
                        onClick={() => onEventSelect(evt)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          <Chip
                            icon={CategoryIcon[evt.category] || <Schedule />}
                            label={evt.category.replace("_", " ")}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              background: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Schedule fontSize="inherit" />
                            {new Date(evt.startTime).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(evt.endTime).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {evt.title}
                        </Typography>

                        {evt.location && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <LocationOn fontSize="small" />
                            <Typography variant="body2">
                              {evt.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "start", gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventExpansion(evt.id);
                          }}
                          sx={{ color: "text.secondary" }}
                        >
                          <ExpandMore
                            sx={{
                              transform:
                                expandedEventId === evt.id
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(evt);
                          }}
                          sx={{ color: "text.secondary" }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmOpen(true);
                            setPendingDelete(evt);
                          }}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={expandedEventId === evt.id}>
                      <Box
                        sx={{
                          mt: 2,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          pt: 2,
                        }}
                      >
                        {evt.description && (
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 2 }}
                          >
                            {evt.description}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.background.default,
                              0.4
                            ),
                            borderRadius: 2,
                            p: 2,
                            mt: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Note fontSize="small" />
                            {evt.notes.length} Note
                            {evt.notes.length > 1 && "s"}
                          </Typography>

                          {evt.notes.map((note) => (
                            <Box
                              key={note.id}
                              sx={{
                                display: "flex",
                                gap: 1.5,
                                mb: 2,
                                p: 1.5,
                                background: alpha(
                                  theme.palette.background.paper,
                                  0.4
                                ),
                                borderRadius: 2,
                                position: "relative",
                              }}
                            >
                              {editingNote?.id === note.id ? (
                                <>
                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={editingNote.content}
                                    onChange={(e) =>
                                      setEditingNote({
                                        ...editingNote,
                                        content: e.target.value,
                                      })
                                    }
                                    autoFocus
                                    sx={{ flexGrow: 1 }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      onUpdateNote(evt.id, note.id, {
                                        content: editingNote.content,
                                      });
                                      setEditingNote(null);
                                    }}
                                    color="primary"
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: theme.palette.primary.main,
                                    }}
                                  >
                                    {note.user.fullName[0]}
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 500 }}
                                      >
                                        {note.user.fullName}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        {new Date(
                                          note.createdAt
                                        ).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                      {note.content}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: isMobile ? "flex" : undefined,
                                    }}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setEditingNote({
                                          id: note.id,
                                          content: note.content,
                                        })
                                      }
                                      sx={{ color: "text.secondary" }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        onDeleteNote(evt.id, note.id)
                                      }
                                      sx={{ color: "error.main" }}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </>
                              )}
                            </Box>
                          ))}

                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            {showAddNote ? (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  size="small"
                                  placeholder="Enter your note..."
                                  value={newNoteContent}
                                  onChange={(e) =>
                                    setNewNoteContent(e.target.value)
                                  }
                                  autoFocus
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (newNoteContent.trim()) {
                                      onAddNote(evt.id, {
                                        content: newNoteContent,
                                      });
                                      setNewNoteContent("");
                                      setShowAddNote(false);
                                    }
                                  }}
                                  color="primary"
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => setShowAddNote(false)}
                                  color="inherit"
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => setShowAddNote(true)}
                                sx={{
                                  alignSelf: "flex-start",
                                  color: "text.secondary",
                                  borderColor: "divider",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                    color: "primary.main",
                                  },
                                }}
                              >
                                Add Note
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            position: "relative",
                          }}
                        >
                          <AvatarGroup
                            max={4}
                            sx={{
                              "& .MuiAvatar-root": {
                                width: 28,
                                height: 28,
                                fontSize: "0.75rem",
                              },
                            }}
                          >
                            {evt.assignedUsers.map((user) => (
                              <Avatar
                                key={user.user.id}
                                alt={user.user.fullName}
                                sx={{ bgcolor: theme.palette.primary.main }}
                              >
                                {user.user.fullName[0]}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          <Typography variant="caption" color="textSecondary">
                            {evt.assignedUsers.length} participant
                            {evt.assignedUsers.length > 1 ||
                              (evt.assignedUsers.length == 0 && "s")}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingMembersEventId(evt.id);
                              setSelectedMemberIds(
                                evt.assignedUsers.map((u) => u.user.id)
                              );
                            }}
                            className="edit-members-button"
                            sx={{
                              opacity: 1,
                              transition: "opacity 0.2s",
                              color: "text.secondary",
                              ml: "auto",
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Collapse>
                  </StyledEventCard>
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
