"use client";

import {
  Card,
  Typography,
  Button,
  CardMedia,
  Box,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { Delete, ExitToApp } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import apiClient from "@/utils/apiClient";
import ConfirmationDialog from "./ConfirmationDialog";
import { useUserStore } from "@/stores/user-store";
import { useNotificationStore } from "@/stores/notification-store";
import { getUserInfo } from "@/utils/userHelper";
import { formatDate } from "@/utils/dateFormatter";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: {
    email: string;
  };
}

interface TripData {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Array<{
    tripId: number;
    userId: string;
    role: string;
    user: { email: string };
  }>;
  expenses: Expense[];
  stays: Array<[]>;
  imageUrl: string;
  expenseSummary: {
    breakdown: Array<{
      category: string;
      total: number;
    }>;
    totalExpenses: number;
  };
}

interface TripCardProps {
  tripData: TripData;
  onDelete: (tripId: number) => void;
}

export default function TripCard({ tripData, onDelete }: TripCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { setNotification } = useNotificationStore();
  const user = useUserStore((state) => state.user);
  const userInfo = user ? getUserInfo(user) : null;
  const isCreator = userInfo?.isCreator(tripData) ?? false;

  const cardImage = tripData.imageUrl
    ? tripData.imageUrl
    : "/dashboard/dashboard_6.jpg"; // have a default image if trip doesn't have associated image

  const handleViewTrip = () => {
    router.push(`/trips/${tripData.id}`);
  };

  const handleEdit = () => {
    router.push(`/trips/${tripData.id}?edit=true`);
  };

  const handleDeleteTrip = async () => {
    try {
      await apiClient.delete(`/trips/${tripData.id}`);
      setDeleteDialogOpen(false);
      onDelete(tripData.id);
      setNotification("Trip has been successfully deleted!", "success");
    } catch (error) {
      console.error("Error deleting trip:", error);
      setNotification("Failed to delete trip", "error");
    }
  };

  const handleLeaveTrip = async () => {
    try {
      await apiClient.delete(`/trips/${tripData.id}/members/leave`);
      setDeleteDialogOpen(false);
      onDelete(tripData.id);
      setNotification("You successfully left the trip!", "success");
    } catch (error) {
      console.error("Error leaving trip:", error);
      setNotification("Failed to leave trip", "error");
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
              title="Edit"
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
              size="small"
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
          component="img"
          image={cardImage}
          alt={tripData.name}
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
            {tripData.name}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontStyle: "italic", my: 1 }}>
            {tripData.destination}
          </Typography>
          <Typography variant="caption">{`${formatDate(tripData.startDate)} – ${formatDate(tripData.endDate)}`}</Typography>

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
        onConfirm={isCreator ? handleDeleteTrip : handleLeaveTrip}
        title={isCreator ? "Delete Trip" : "Leave Trip"}
        message={
          isCreator
            ? `Are you sure you want to delete "${tripData.name}"?`
            : `Are you sure you want to leave "${tripData.name}"?`
        }
      />
    </>
  );
}
