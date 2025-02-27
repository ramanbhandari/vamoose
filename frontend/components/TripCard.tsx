"use client";

import {
  Card,
  Typography,
  Button,
  CardMedia,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { Delete, ExitToApp } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import apiClient from "@/utils/apiClient";
import ConfirmationDialog from "./ConfirmationDialog";
import { getUserInfo } from "@/utils/userHelper";
import { User } from "@supabase/supabase-js";

interface TripData {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Array<{ tripId: number; userId: string; role: string }>;
  expenses: Array<[]>;
  stays: Array<[]>;
  imageUrl?: string;
}

interface TripCardProps {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  imageUrl?: string;
  onDelete: (tripId: number) => void;
  userId: string;
  tripData: TripData;
}

export default function TripCard ({
  tripId,
  title,
  userId,
  tripData,
  ...props
}: TripCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const cardImage = props.imageUrl
    ? props.imageUrl
    : "/dashboard/dashboard_6.jpg"; // have a default image if trip doesn't have associated image
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const userInfo = getUserInfo({ id: userId } as User);
  const isCreator = userInfo?.isCreator(tripData);

  const handleViewTrip = () => {
    router.push(`/trips/${tripId}`);
  };

  const handleEdit = () => {
    router.push(`/trips/${tripId}?edit=true`);
  };

  const handleDeleteTrip = async () => {
    try {
      await apiClient.delete(`/trips/${tripId}`);
      setDeleteDialogOpen(false);
      props.onDelete(tripId);
      setSuccessSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const handleLeaveTrip = async () => {
    try {
      await apiClient.delete(`/trips/${tripId}/members/leave`);
      setDeleteDialogOpen(false);
      props.onDelete(tripId);
      setSuccessSnackbarOpen(true);
    } catch (error) {
      console.error("Error leaving trip:", error);
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
          {isCreator && (
            <Tooltip
              title='Edit'
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.background.default,
                  },
                },
              }}
            >
              <IconButton
                size='small'
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
            </Tooltip>
          )}

          <Tooltip
            title={isCreator ? "Delete Trip" : "Leave Trip"}
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.background.default,
                },
              },
            }}
          >
            <IconButton
              size='small'
              onClick={() => setDeleteDialogOpen(true)}
              aria-label={isCreator ? "Delete trip" : "Leave trip"}
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
              {isCreator ? <Delete /> : <ExitToApp />}
            </IconButton>
          </Tooltip>
        </Box>

        <CardMedia
          component='img'
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
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant='subtitle2' sx={{ fontStyle: "italic", my: 1 }}>
            {props.destination}
          </Typography>
          <Typography variant='caption'>{`${props.startDate} – ${props.endDate}`}</Typography>
          <Button
            variant='contained'
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
        onConfirm={isCreator ? handleDeleteTrip : handleLeaveTrip}
        title={isCreator ? "Delete Trip" : "Leave Trip"}
        message={
          isCreator
            ? `Are you sure you want to delete "${title}"?`
            : `Are you sure you want to leave "${title}"?`
        }
      />

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessSnackbarOpen(false)}
          severity='success'
          sx={{ width: "100%" }}
        >
          {isCreator
            ? "Trip has been successfully deleted!"
            : "You successfully left the trip!"}
        </Alert>
      </Snackbar>
    </>
  );
}
