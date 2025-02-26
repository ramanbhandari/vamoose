"use client";

import {
  Card,
  Typography,
  Button,
  CardMedia,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import ConfirmationDialog from "./ConfirmationDialog";

interface TripCardProps {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  imageUrl?: string;
  onDelete?: (tripId: number) => void; // Optional callback for parent component updates
}

export default function TripCard({
  tripId,
  title,
  startDate,
  endDate,
  destination,
  imageUrl,
  onDelete,
}: TripCardProps) {
  const router = useRouter();
  const cardImage = imageUrl ? imageUrl : "/dashboard/dashboard_6.jpg"; // have a default image if trip doesn't have associated image
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);

  const handleViewTrip = () => {
    router.push(`/trips/${tripId}`);
  };

  const handleEdit = () => {
    router.push(`/trips/${tripId}?edit=true`);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/trips/${tripId}`);
      if (onDelete) {
        onDelete(tripId);
      }
      setDeleteDialogOpen(false);
      setSuccessSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  return (
    <>
      <Card
        sx={{
          position: "relative",
          width: "100%",
          height: "250px",
          borderRadius: 2,
          overflow: "hidden",
          transition: "transform 0.2s",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: 6,
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            display: "flex",
            gap: 0.25,
            background: "rgba(0,0,0,0)",
            borderRadius: "20px",
            padding: "2px",
          }}
        >
          <IconButton
            size="small"
            onClick={handleEdit}
            sx={{
              background: "none",
              color: "white",
              transition: "transform 0.3s, color 0.5s",
              "&:hover": {
                background: "none",
                transform: "scale(1.2)",
                color: "var(--accent)",
              },
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              background: "none",
              color: "white",
              transition: "transform 0.3s, color 0.5s",
              "&:hover": {
                background: "none",
                transform: "scale(1.2)",
                color: "primary.main",
              },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <CardMedia
          component="img"
          image={cardImage}
          alt={title}
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.7)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            p: 2,
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: "100%",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontStyle: "italic", my: 1 }}>
            {destination}
          </Typography>
          <Typography variant="caption">{`${startDate} – ${endDate}`}</Typography>
          <Button
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              "&:hover": {
                bgcolor: "primary.main",
              },
            }}
            fullWidth
            onClick={handleViewTrip}
          >
            View Trip
          </Button>
        </Box>
      </Card>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${title}"?`}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSuccessSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Trip "{title}" has been successfully deleted
        </Alert>
      </Snackbar>
    </>
  );
}
