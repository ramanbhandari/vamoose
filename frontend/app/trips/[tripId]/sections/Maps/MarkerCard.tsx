/**
 * @file MarkerCard.tsx
 * @description UI card component that displays details about a map marker (location/POI).
 * Supports saving, editing notes, deleting locations, and displaying user info and permissions.
 * Dynamically adjusts position based on MapLibre coordinates and handles hover vs selected view.
 */

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
  Avatar,
  alpha,
  Chip,
} from "@mui/material";
import { Map as MapType } from "maplibre-gl";
import { LocationType } from "./services/mapbox";
import {
  Language,
  Clear,
  CheckCircle,
  Edit,
  Delete,
  Note,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import { useNotificationStore } from "@/stores/notification-store";
import { useTheme } from "@mui/material/styles";
import { useUserStore } from "@/stores/user-store";
import { useTripStore } from "@/stores/trip-store";
import { getUserInfo } from "@/utils/userHelper";
import {
  mapClientTypeToServerType,
  saveLocation,
  updateLocationNotes,
  deleteLocation,
  SavedPOI,
} from "./services/markedLocations";
import DeleteConfirmationDialog from "../Itinerary/ListView/DeleteConfirmationDialog";

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
  onMouseEnter,
  onMouseLeave,
  createdBy,
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
  const theme = useTheme();

  // Get user and trip data for permission checks
  const user = useUserStore((state) => state.user);
  const { tripData } = useTripStore();

  // Check user permissions
  const userInfo = user ? getUserInfo(user) : null;
  const isCreator = userInfo?.isCreator(tripData) ?? false;
  const isAdmin = userInfo?.isAdmin(tripData) ?? false;

  // Check if current user is the note creator
  const isNoteCreator = createdBy?.id === user?.id;

  // Determine if user can edit notes
  const canEditNotes = isNoteCreator;

  // Determine if user can delete location
  const canDeleteLocation = isCreator || isAdmin || isNoteCreator;

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
          createdBy: savedLocation.createdBy || {
            id: user?.id || "",
            fullName: user?.user_metadata?.full_name || "You",
            email: user?.email || "",
          },
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
      const updatedLocation = await updateLocationNotes(
        tripId,
        id,
        notesText || ""
      );
      setIsEditingNotes(false);

      // Update the notes in the parent component through onSave callback if available
      if (onSave) {
        const updatedPOI: SavedPOI = {
          id: id,
          name: name,
          address: address,
          website: website,
          locationType: locationType,
          coordinates: coordinates,
          isSaved: true,
          notes: notesText,
          createdBy: updatedLocation.createdBy ||
            createdBy || {
              id: user?.id || "",
              fullName: user?.user_metadata?.full_name || "You",
              email: user?.email || "",
            },
        };

        onSave(updatedPOI);
      }

      setNotification("Notes updated successfully", "success");

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 300);
      }
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

  // Function to determine role label
  const getUserRoleLabel = (userId: string) => {
    if (!tripData || !userId) return "Member";

    const member = tripData.members.find((member) => member.userId === userId);
    if (!member) return "Member";

    return member.role.charAt(0).toUpperCase() + member.role.slice(1);
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
                      sx={{
                        color: "success.main",
                      }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isSaved && canDeleteLocation && (
                  <Tooltip title="Delete location">
                    <IconButton
                      size="small"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      sx={{
                        color: "error.main",
                      }}
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
                      variant="subtitle2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Note fontSize="small" />
                      Notes
                    </Typography>
                    {!isEditingNotes && canEditNotes ? (
                      <IconButton
                        size="small"
                        onClick={() => setIsEditingNotes(true)}
                        sx={{ padding: 0.5 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    ) : isEditingNotes ? (
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleUpdateNotes}
                        sx={{ padding: "2px 8px" }}
                      >
                        Save
                      </Button>
                    ) : null}
                  </Box>
                  {isEditingNotes ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={1}
                      maxRows={2}
                      variant="outlined"
                      size="small"
                      value={notesText || ""}
                      onChange={(e) =>
                        setNotesText(e.target.value.substring(0, 100))
                      }
                      placeholder="Add notes about this location..."
                      inputProps={{ maxLength: 100 }}
                      helperText={`${notesText ? notesText.length : 0}/100`}
                    />
                  ) : (
                    <Box
                      sx={{
                        backgroundColor: alpha(
                          theme.palette.background.default,
                          0.4
                        ),
                        borderRadius: 2,
                        p: 1.5,
                        mt: 1,
                      }}
                    >
                      {notesText ? (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
                            p: 1.5,
                            background: alpha(
                              theme.palette.background.paper,
                              0.4
                            ),
                            borderRadius: 2,
                            position: "relative",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: theme.palette.primary.main,
                            }}
                          >
                            {createdBy?.fullName?.[0] || "U"}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {createdBy?.fullName || "User"}
                                </Typography>
                                {createdBy && (
                                  <Chip
                                    label={getUserRoleLabel(createdBy.id)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 16,
                                      fontSize: "0.6rem",
                                      fontWeight: 500,
                                      px: 0.5,
                                      "& .MuiChip-label": {
                                        px: 0.5,
                                      },
                                      borderColor:
                                        theme.palette.mode === "dark"
                                          ? "white"
                                          : theme.palette.secondary.main,
                                      color:
                                        theme.palette.mode === "dark"
                                          ? "white"
                                          : theme.palette.secondary.main,
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {new Date().toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2">{notesText}</Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ p: 1 }}>
                          No notes added yet.
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {!isSaved && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Note
                      fontSize="small"
                      sx={{ mr: 0.5, color: "text.secondary" }}
                    />
                    <Typography variant="subtitle2">Add Notes</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    maxRows={2}
                    variant="outlined"
                    size="small"
                    value={notesText || ""}
                    onChange={(e) =>
                      setNotesText(e.target.value.substring(0, 100))
                    }
                    placeholder="Add notes about this location..."
                    inputProps={{ maxLength: 100 }}
                    helperText={`${notesText ? notesText.length : 0}/100`}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Website links section */}
            <Box
              sx={{
                mt: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Language
                  fontSize="small"
                  sx={{ mr: 0.5, color: "primary.main" }}
                />
                <Link
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
              {isSaved && createdBy && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Added by {createdBy.fullName || "User"}
                  </Typography>
                  <Chip
                    label={getUserRoleLabel(createdBy.id)}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 16,
                      fontSize: "0.6rem",
                      fontWeight: 500,
                      px: 0.5,
                      "& .MuiChip-label": {
                        px: 0.5,
                      },
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "white"
                          : theme.palette.secondary.main,
                      color:
                        theme.palette.mode === "dark"
                          ? "white"
                          : theme.palette.secondary.main,
                    }}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Fade>
      </Box>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        description={`Are you sure you want to delete "${name}"?`}
      />
    </>
  );
}
