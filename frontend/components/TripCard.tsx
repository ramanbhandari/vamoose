"use client";

import { Card, Typography, Button, CardMedia, Box } from "@mui/material";
import { useRouter } from "next/navigation";

interface TripCardProps {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  imageUrl?: string;
}

export default function TripCard({
  tripId,
  title,
  startDate,
  endDate,
  destination,
  imageUrl,
}: TripCardProps) {
  const router = useRouter();
  const cardImage = imageUrl ? imageUrl : "/dashboard/dashboard_6.jpg"; // have a default image if trip doesn't have associated image

  const handleViewTrip = () => {
    router.push(`/trips/${tripId}`);
  };

  return (
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
  );
}
