import React from "react";
import { ToolbarProps as RBCToolbarProps } from "react-big-calendar";
import { Box, Typography, IconButton, Button } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { ItineraryEvent } from "../types";

export interface CalendarEvent {
  title: string | React.ReactNode;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: ItineraryEvent;
}

const allowedViews = ["month", "week", "day"] as const;
type AllowedView = (typeof allowedViews)[number];

const CustomToolbar: React.FC<RBCToolbarProps<CalendarEvent, object>> = (
  toolbar
) => {
  const { label, onNavigate, onView, view, views } = toolbar;
  // Convert the views prop into an array of allowed views
  const availableViews: AllowedView[] = Array.isArray(views)
    ? views.filter((v): v is AllowedView =>
        allowedViews.includes(v as AllowedView)
      )
    : Object.keys(views).filter((key): key is AllowedView =>
        allowedViews.includes(key as AllowedView)
      );

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => onNavigate("PREV")} size="small">
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Button
          onClick={() => onNavigate("TODAY")}
          variant="outlined"
          size="small"
        >
          Today
        </Button>
        <IconButton onClick={() => onNavigate("NEXT")} size="small">
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {availableViews.map((v: AllowedView) => (
          <Button
            key={v}
            onClick={() => onView(v)}
            variant={v === view ? "contained" : "outlined"}
            size="small"
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default CustomToolbar;
