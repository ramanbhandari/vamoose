import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Link,
  Fade,
  TextField,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Map as MapType } from "maplibre-gl";
import { LocationType } from "./services/mapbox";
import {
  Language,
  Clear,
  CheckCircle,
  Add,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import { useNotificationStore } from "@/stores/notification-store";
import {
  mapClientTypeToServerType,
  saveLocation,
  updateLocationNotes,
  deleteLocation,
  SavedPOI,
} from "./services/markedLocations";

interface MarkerCardProps {
  map: MapType;
  name: string;
  address?: string;
  locationType: LocationType;
  coordinates: [number, number];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  color?: string;
  isSelected?: boolean;
  website?: string;
  onClose?: () => void;
  isSaved?: boolean;
  notes?: string;
  onSave?: (savedPOI: SavedPOI) => void;
  onDelete?: (id: string) => void;
  id?: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function MarkerCard({
  map,
  name,
  address,
  locationType,
  coordinates,
  color = "#757575",
  isSelected = false,
  website,
  onClose,
  isSaved = false,
  notes = "",
  onSave,
  onDelete,
  id,
  createdBy,
  onMouseEnter,
  onMouseLeave,
}: MarkerCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const params = useParams();
  const tripId = Number(params.tripId);
  const { setNotification } = useNotificationStore();

  // Create the Google search URL
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    name + " " + (address || "")
  )}`;

  useEffect(() => {
    const updatePosition = () => {
      const point = map.project(coordinates);
      setPosition({ x: point.x, y: point.y });
    };

    // Initial position calculation
    updatePosition();

    // Update position on map move and zoom
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, coordinates]);

  useEffect(() => {
    setNotesText(notes);
  }, [notes]);

  const handleSaveLocation = async () => {
    if (isSaved) return;

    setIsSaving(true);
    try {
      const data = {
        name,
        type: mapClientTypeToServerType(locationType),
        coordinates: {
          latitude: coordinates[1],
          longitude: coordinates[0],
        },
        address,
        // Use Google search URL if no website is provided
        website: website || googleSearchUrl,
        notes: notesText,
      };

      const savedLocation = await saveLocation(tripId, data);

      if (onSave) {
        const savedPOI: SavedPOI = {
          id: savedLocation.id,
          name: savedLocation.name,
          address: savedLocation.address,
          website: savedLocation.website,
          locationType: locationType,
          coordinates: coordinates,
          isSaved: true,
          notes: savedLocation.notes,
          createdBy: savedLocation.createdBy,
        };

        onSave(savedPOI);
      }

      setNotification("Location saved successfully", "success");
    } catch (error) {
      console.error("Error saving location:", error);
      setNotification("Failed to save location", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!id || !isSaved) return;

    try {
      await updateLocationNotes(tripId, id, notesText || "");
      setIsEditingNotes(false);
      setNotification("Notes updated successfully", "success");
    } catch (error) {
      console.error("Error updating notes:", error);
      setNotification("Failed to update notes", "error");
    }
  };

  const handleDeleteLocation = async () => {
    if (!id || !isSaved) return;

    setIsDeleting(true);
    try {
      await deleteLocation(tripId, id);
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete(id);
      }
      if (onClose) {
        onClose();
      }
      setNotification("Location deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting location:", error);
      setNotification("Failed to delete location", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // For hover state (non-selected)
  if (!isSelected) {
    return (
      <Box
        className="marker-card"
        sx={{
          position: "absolute",
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -120%)",
          zIndex: 1500,
          pointerEvents: "auto",
          width: "200px",
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            backgroundColor: "background.paper",
            color: "text.primary",
            borderLeft: `4px solid ${color}`,
            maxWidth: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {name}
          </Typography>
          {address && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {address}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  // For selected state
  return (
    <>
      <Box
        className="marker-card"
        sx={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "400px",
          zIndex: 1000,
        }}
      >
        <Fade in={true}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderLeft: `4px solid ${color}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {name}
              </Typography>
              <Box>
                {!isSaved && (
                  <Tooltip title="Save location">
                    <IconButton
                      size="small"
                      onClick={handleSaveLocation}
                      disabled={isSaving}
                      sx={{ color: "success.main" }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isSaved && (
                  <Tooltip title="Delete location">
                    <IconButton
                      size="small"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      sx={{ color: "error.main" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onClose && (
                  <IconButton size="small" onClick={onClose}>
                    <Clear fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {address && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {address}
              </Typography>
            )}

            {/* Notes section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              {isSaved && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                    >
                      Notes
                    </Typography>
                    {!isEditingNotes ? (
                      <IconButton
                        size="small"
                        onClick={() => setIsEditingNotes(true)}
                        sx={{ padding: 0.5 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    ) : (
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleUpdateNotes}
                        sx={{ padding: "2px 8px" }}
                      >
                        Save
                      </Button>
                    )}
                  </Box>
                  {isEditingNotes ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      value={notesText || ""}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes about this location..."
                    />
                  ) : (
                    <Typography variant="body2">
                      {notesText ? notesText : "No notes added yet."}
                    </Typography>
                  )}
                </Box>
              )}

              {!isSaved && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Add
                      fontSize="small"
                      sx={{ mr: 0.5, color: "text.secondary" }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                    >
                      Add Notes
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    size="small"
                    value={notesText || ""}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add notes about this location..."
                  />
                </Box>
              )}

              {/* Creator info if available */}
              {isSaved && createdBy && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Saved by {createdBy.fullName}
                </Typography>
              )}
            </Box>

            {/* Website links section */}
            <Box
              sx={{
                mt: 1,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Language
                  fontSize="small"
                  sx={{ mr: 0.5, color: "primary.main" }}
                />
                <Link
                  // Use Google search URL if no website is provided
                  href={website || googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    color: "primary.main",
                    fontWeight: "medium",
                  }}
                >
                  {website ? "Visit website" : "Search on Google"}
                </Link>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Location</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this saved location? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteLocation}
            color="error"
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
