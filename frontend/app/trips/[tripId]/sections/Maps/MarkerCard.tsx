import React, { useState, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Map as MapType } from "maplibre-gl";
import { LocationType } from "./services/mapbox";

interface MarkerCardProps {
  map: MapType;
  name: string;
  address?: string;
  locationType: LocationType;
  coordinates: [number, number]; // [longitude, latitude]
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  color?: string; // Added color prop to match marker color
}

export default function MarkerCard({
  map,
  name,
  address,
  coordinates,
  color = "#757575", // Default color if none provided
}: MarkerCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updatePosition = () => {
    const point = map.project(coordinates);
    setPosition({ x: point.x, y: point.y });
  };

  useEffect(() => {
    updatePosition();
    map.on("move", updatePosition);
    return () => {
      map.off("move", updatePosition);
    };
  }, [map, coordinates]);

  return (
    <Box
      sx={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
        zIndex: 1000,
        pointerEvents: "auto", // Changed to auto to handle mouse events
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: "background.paper",
          color: "text.primary",
          borderLeft: `4px solid ${color}`, // Use the marker's color here
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {name}
        </Typography>
        {address && (
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}