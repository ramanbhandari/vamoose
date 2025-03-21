import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, IconButton, Link, Fade } from "@mui/material";
import { Map as MapType } from "maplibre-gl";
import { LocationType } from "./services/mapbox";
import { Language, Clear } from "@mui/icons-material";

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
}

export default function MarkerCard({
  map,
  name,
  address,
  coordinates,
  color = "#757575",
  isSelected = false,
  website,
  onClose,
  onMouseEnter,
  onMouseLeave,
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
            {onClose && (
              <IconButton size="small" onClick={onClose}>
                <Clear fontSize="small" />
              </IconButton>
            )}
          </Box>

          {address && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {address}
            </Typography>
          )}

          {/* Website links section */}
          <Box
            sx={{
              mt: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {/* Direct website link */}
            {website && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Language
                  fontSize="small"
                  sx={{ mr: 0.5, color: "primary.main" }}
                />
                <Link
                  href={website}
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
                  Visit website
                </Link>
              </Box>
            )}

            {/* Google search link */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Language
                fontSize="small"
                sx={{ mr: 0.5, color: "text.secondary" }}
              />
              <Link
                href={`https://www.google.com/search?q=${encodeURIComponent(name + " " + (address || ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Search on Google
              </Link>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
