import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  TextField,
  Button,
  Avatar,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  Checkbox,
  useMediaQuery,
  useTheme,
  ListItemButton,
  ListItem,
  List,
  ListItemIcon,
} from "@mui/material";
import {
  Add,
  Check,
  Close,
  DeleteOutline,
  Edit,
  ExpandMore,
  Flight,
  Group,
  Hiking,
  LocationOn,
  Note,
  Restaurant,
  Schedule,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { ItineraryEvent, CreateNote } from "../types";
import { Member } from "@/types";
import { StyledEventCard } from "./styled";
import { FloatingDialogSmall } from "../../Polls/styled";

const CategoryIcon = {
  MEAL: <Restaurant fontSize="small" />,
  ACTIVITY: <Hiking fontSize="small" />,
  TRAVEL: <Flight fontSize="small" />,
  MEETING: <Group fontSize="small" />,
  GENERAL: <Schedule fontSize="small" />,
  FREE_TIME: <Schedule fontSize="small" />,
  OTHER: <Note fontSize="small" />,
};

interface EventCardProps {
  event: ItineraryEvent;

  onEdit: (event: ItineraryEvent) => void;
  onDelete: (eventId: number) => void;
  onClose: () => void;
  onAddNote: (eventId: number, note: CreateNote) => void;
  onUpdateNote: (eventId: number, noteId: number, note: CreateNote) => void;
  onDeleteNote: (eventId: number, noteId: number) => void;
  members: Member[];
  onAssignMembers: (eventId: number, userIds: string[]) => void;
  onUnAssignMembers: (eventId: number, userIds: string[]) => void;
  expanded?: boolean; // true = show full details; if false, show condensed version with an expand button
  calendarMode?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onClose,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  members,
  onAssignMembers,
  onUnAssignMembers,
  expanded = true,
  calendarMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [editingNote, setEditingNote] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  // Use internal state to control expansion so we can toggle it.
  const [isExpanded, setIsExpanded] = useState(expanded);

  // State for managing assigned members editing
  const [editingMembers, setEditingMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // When the event changes, update selectedMemberIds to match current assigned users
  useEffect(() => {
    setSelectedMemberIds(event.assignedUsers.map((u) => u.user.id));
  }, [event]);

  // Toggle a member in the selected list
  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Save changes for assigned members
  const handleSaveMembers = () => {
    const currentIds = event.assignedUsers.map((u) => u.user.id);
    const added = selectedMemberIds.filter((id) => !currentIds.includes(id));
    const removed = currentIds.filter((id) => !selectedMemberIds.includes(id));
    if (added.length > 0) onAssignMembers(event.id, added);
    if (removed.length > 0) onUnAssignMembers(event.id, removed);
    setEditingMembers(false);
  };

  return (
    <StyledEventCard
      sx={{
        background: calendarMode ? theme.palette.background.default : undefined,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Chip
              icon={CategoryIcon[event.category] || <Schedule />}
              label={event.category.replace("_", " ")}
              size="small"
              sx={{
                textTransform: "capitalize",
                background: alpha(theme.palette.primary.main, 0.1),
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
              {new Date(event.startTime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(event.endTime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {event.title}
          </Typography>
          {event.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" />
              <Typography variant="body2">{event.location}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
          {!calendarMode && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              sx={{ color: "text.secondary" }}
            >
              <ExpandMore
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            sx={{ color: "text.secondary" }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteOutline />
          </IconButton>

          {calendarMode && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{ color: "text.secondary" }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            mt: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pt: 2,
          }}
        >
          {event.description && (
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              {event.description}
            </Typography>
          )}
          {/* Notes Section */}
          <Box
            sx={{
              backgroundColor: alpha(theme.palette.background.default, 0.4),
              borderRadius: 2,
              p: 2,
              mt: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Note fontSize="small" />
              {event.notes.length} Note{event.notes.length !== 1 && "s"}
            </Typography>
            {event.notes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  mb: 2,
                  p: 1.5,
                  background: alpha(theme.palette.background.paper, 0.4),
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
                        onUpdateNote(event.id, note.id, {
                          content: editingNote!.content,
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
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {note.user.fullName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {new Date(note.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{note.content}</Typography>
                    </Box>
                    <Box sx={{ display: isMobile ? "flex" : undefined }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setEditingNote({ id: note.id, content: note.content })
                        }
                        sx={{ color: "text.secondary" }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteNote(event.id, note.id)}
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
              sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}
            >
              {showAddNote ? (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Enter your note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    autoFocus
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (newNoteContent.trim()) {
                        onAddNote(event.id, { content: newNoteContent });
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
          {/* Assigned Members Section */}
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
              {event.assignedUsers.map((user) => (
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
              {event.assignedUsers.length} participant
              {event.assignedUsers.length !== 1 && "s"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setEditingMembers(true)}
              sx={{ ml: "auto", color: "text.secondary" }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Collapse>

      {editingMembers && (
        <FloatingDialogSmall
          open={editingMembers}
          onClose={() => setEditingMembers(false)}
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
              <IconButton onClick={() => setEditingMembers(false)} size="small">
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
                    onClick={() => handleToggleMember(member.userId)}
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
            <Button onClick={() => setEditingMembers(false)} color="inherit">
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
      )}
    </StyledEventCard>
  );
};

export default EventCard;
