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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";

interface TripCardProps {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  imageUrl?: string;
  onDelete?: (tripId: number) => void; // Optional callback for parent component updates
}

const defaultImages = [
  "/dashboard/dashboard_1.jpg",
  "/dashboard/dashboard_2.jpg",
  "/dashboard/dashboard_3.jpg",
  "/dashboard/dashboard_4.jpg",
  "/dashboard/dashboard_5.jpg",
  "/dashboard/dashboard_6.jpg",
  "/dashboard/dashboard_7.avif",
  "/dashboard/dashboard_8.jpg",
  "/dashboard/dashboard_9.jpg",
  "/dashboard/dashboard_10.jpg",
  "/dashboard/dashboard_13.jpg",
  "/dashboard/dashboard_14.jpg",
  "/dashboard/dashboard_15.jpg",
  "/dashboard/dashboard_11.jpg",
  "/dashboard/dashboard_12.jpg",
  "/dashboard/dashboard_16.jpg",
  "/dashboard/dashboard_17.jpg",
  "/dashboard/dashboard_18.jpg",
  "/dashboard/dashboard_19.jpg",
  "/dashboard/dashboard_20.jpg",
  "/dashboard/dashboard_21.jpg",
  "/dashboard/dashboard_22.jpg",
  "/dashboard/dashboard_23.jpg",
];

const getRandomImage = () => {
  const randomIndex = Math.floor(Math.random() * defaultImages.length);
  return defaultImages[randomIndex];
};

const fetchDestinationImage = async (
  destination: string
): Promise<string | null> => {
  try {
    const cityName = destination.split(",")[0].trim();

    const wikiResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${cityName}&pithumbsize=600`
    );

    const pages = wikiResponse.data.query.pages;
    const firstPage = Object.keys(pages)[0];
    const wikiImage = pages[firstPage]?.thumbnail?.source;

    if (wikiImage) return wikiImage;

    return null;
  } catch (error) {
    console.error("Error fetching destination image:", error);
    return null;
  }
};

export default function TripCard({
  tripId,
  title,
  startDate,
  endDate,
  destination,
  onDelete,
}: TripCardProps) {
  const router = useRouter();
  const [cardImage, setCardImage] = useState<string>(getRandomImage());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const loadImage = async () => {
      if (destination) {
        const fetchedImage = await fetchDestinationImage(destination);
        if (fetchedImage) setCardImage(fetchedImage);
      }
    };
    loadImage();
  }, [destination]);

  const handleViewTrip = () => {
    router.push(`/trips/${tripId}`);
  };

  const handleEdit = () => {
    router.push(`/trips/${tripId}?edit=true`);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== title) return;

    try {
      await apiClient.delete(`/trips/${tripId}`);
      if (onDelete) {
        onDelete(tripId);
      }
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");
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
          <IconButton size="small" onClick={handleEdit} 
          sx=
          {{ 
            background: "none",
            color: "white", 
            transition: "transform 0.3s, color 0.5s",
              "&:hover": {
                background: "none",
                transform: "scale(1.2)",
                color: "var(--accent)",
              },
          }}>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Trip</DialogTitle>
        <DialogContent>
          <Typography>
            To delete &quot;{title}&quot;, please type the trip name to confirm:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            margin="normal"
            placeholder={title}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={deleteConfirmation !== title}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
