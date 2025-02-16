"use client";

import { Card, Typography, Button, CardMedia, Box } from "@mui/material";

interface TripCardProps {
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
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

export default function TripCard({
  title,
  description,
  date,
  imageUrl,
}: TripCardProps) {
  const card_image = imageUrl || getRandomImage();
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
        image={card_image}
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
        <Typography variant="body2" sx={{ my: 1 }}>
          {description}
        </Typography>
        <Typography variant="caption">{date}</Typography>
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
        >
          View Trip
        </Button>
      </Box>
    </Card>
  );
}
