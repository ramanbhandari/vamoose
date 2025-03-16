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
}

export default function MarkerCard({
  map,
  name,
  address,
  coordinates,
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
        pointerEvents: "none",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: "var(--background-paper)", 
          color: "var(--text)",
          borderLeft: "4px solid var(--primary)", 
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {name}
        </Typography>
        {address && (
          <Typography variant="body2" sx={{ color: "var(--text)" }}>
            {address}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}