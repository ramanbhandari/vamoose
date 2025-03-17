import React, { useState, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Map as MapType } from "maplibre-gl";
import { LocationType } from "./services/mapbox";

interface MarkerCardProps {
  map: MapType;
  name: string;
  address?: string;
  locationType: LocationType;
  coordinates: [number, number];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  color?: string;
}

export default function MarkerCard({
  map,
  name,
  address,
  coordinates,
  color = "#757575",
}: MarkerCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

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

  return (
    <Box
      sx={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
        zIndex: 1000,
        pointerEvents: "none",
        width: "200px",
      }}
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
