import React from "react";
import { ToolbarProps, Navigate } from "react-big-calendar";
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

const CustomToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = (
  props
) => {
  const { label, onNavigate, onView, view } = props;

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    switch (action) {
      case "PREV":
        onNavigate(Navigate.PREVIOUS);
        break;
      case "NEXT":
        onNavigate(Navigate.NEXT);
        break;
      case "TODAY":
        onNavigate(Navigate.TODAY);
        break;
    }
  };

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
        <IconButton onClick={() => handleNavigate("PREV")} size="small">
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Button
          onClick={() => handleNavigate("TODAY")}
          variant="outlined"
          size="small"
        >
          Today
        </Button>
        <IconButton onClick={() => handleNavigate("NEXT")} size="small">
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          onClick={() => onView("month")}
          variant={view === "month" ? "contained" : "outlined"}
          size="small"
        >
          Month
        </Button>
        <Button
          onClick={() => onView("week")}
          variant={view === "week" ? "contained" : "outlined"}
          size="small"
        >
          Week
        </Button>
        <Button
          onClick={() => onView("day")}
          variant={view === "day" ? "contained" : "outlined"}
          size="small"
        >
          Day
        </Button>
      </Box>
    </Box>
  );
};

export default CustomToolbar;
