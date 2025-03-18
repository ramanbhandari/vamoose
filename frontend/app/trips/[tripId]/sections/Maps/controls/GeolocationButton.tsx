import React from "react";
import { Box, IconButton, CircularProgress, useTheme } from "@mui/material";
import { MyLocation } from "@mui/icons-material";

interface GeolocationButtonProps {
  isLocating: boolean;
  onGeolocate: () => void;
}

export default function GeolocationButton({
  isLocating,
  onGeolocate,
}: GeolocationButtonProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: theme.spacing(2),
        left: theme.spacing(2),
        p: 1,
        display: "flex",
        gap: 1,
        zIndex: 1,
        transition: "all 0.3s ease-in-out",
      }}
    >
      <IconButton
        onClick={onGeolocate}
        color="primary"
        aria-label="Locate me"
        sx={{
          backgroundColor: theme.palette.background.paper,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        {isLocating ? (
          <CircularProgress size={24} />
        ) : (
          <MyLocation
            fontSize="large"
            sx={{ color: theme.palette.text.primary }}
          />
        )}
      </IconButton>
    </Box>
  );
}
