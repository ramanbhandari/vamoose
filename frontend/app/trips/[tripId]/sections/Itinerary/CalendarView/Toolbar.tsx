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
        mb: 3,
        p: 2,
        background: "var(--background-paper)",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 6px 24px rgba(0,0,0,0.12)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={() => handleNavigate("PREV")}
          sx={{
            color: "var(--primary)",
            "&:hover": { background: "var(--primary-light)" },
          }}
        >
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Button
          onClick={() => handleNavigate("TODAY")}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "var(--primary)",
            color: "var(--primary)",
            "&:hover": { borderColor: "var(--primary-hover)" },
          }}
        >
          Today
        </Button>
        <IconButton
          onClick={() => handleNavigate("NEXT")}
          sx={{
            color: "var(--primary)",
            "&:hover": { background: "var(--primary-light)" },
          }}
        >
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background:
            "linear-gradient(45deg, var(--primary), var(--secondary))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          onClick={() => onView("month")}
          variant={view === "month" ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            bgcolor: view === "month" ? "var(--primary)" : "transparent",
            color: view === "month" ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === "month" ? "var(--primary-hover)" : "var(--background)",
            },
          }}
        >
          Month
        </Button>

        <Button
          onClick={() => onView("week")}
          variant={view === "week" ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            bgcolor: view === "week" ? "var(--primary)" : "transparent",
            color: view === "week" ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === "week" ? "var(--primary-hover)" : "var(--background)",
            },
          }}
        >
          Week
        </Button>

        <Button
          onClick={() => onView("day")}
          variant={view === "day" ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            bgcolor: view === "day" ? "var(--primary)" : "transparent",
            color: view === "day" ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === "day" ? "var(--primary-hover)" : "var(--background)",
            },
          }}
        >
          Day
        </Button>
      </Box>
    </Box>
  );
};

export default CustomToolbar;
