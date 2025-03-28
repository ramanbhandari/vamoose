/**
 * @file RadiusSlider.tsx
 * @description Vertical slider component to adjust the search radius for map POIs.
 */

import React from "react";
import { Box, Slider, Typography, useTheme } from "@mui/material";

interface RadiusSliderProps {
  searchRadius: number;
  onRadiusChange: (event: Event, value: number | number[]) => void;
}

export default function RadiusSlider({
  searchRadius,
  onRadiusChange,
}: RadiusSliderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: theme.spacing(12),
        left: theme.spacing(3.75),
        zIndex: 100,
        height: "150px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Slider
        value={searchRadius}
        min={1}
        max={15}
        step={1}
        orientation="vertical"
        onChange={onRadiusChange}
        valueLabelDisplay="off"
        aria-labelledby="search-radius-slider"
        sx={{
          height: "100%",
          "& .MuiSlider-thumb": {
            width: 16,
            height: 16,
          },
          "& .MuiSlider-track": {
            width: 4,
          },
          "& .MuiSlider-rail": {
            width: 4,
          },
        }}
      />
      <Typography
        variant="caption"
        color="white"
        sx={{
          mt: 1,
          textShadow: "0px 0px 4px rgba(0,0,0,0.7)",
          fontWeight: "bold",
        }}
      >
        {searchRadius}km
      </Typography>
    </Box>
  );
}
