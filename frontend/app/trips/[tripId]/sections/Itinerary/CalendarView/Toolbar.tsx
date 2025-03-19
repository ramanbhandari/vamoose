import React from "react";
import { ToolbarProps, Navigate, Views } from "react-big-calendar";
import {
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { label, onNavigate, onView, view } = props;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 1 : 2,
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        p: 2,
        background: "var(--background-paper)",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 6px 24px rgba(0,0,0,0.12)" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          order: isMobile ? 2 : 1,
        }}
      >
        <IconButton
          onClick={() => onNavigate(Navigate.PREVIOUS)}
          size={isMobile ? "small" : "medium"}
          sx={{
            color: "var(--primary)",
            px: 2,
            "&:hover": { background: "var(--primary-light)" },
          }}
        >
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Button
          onClick={() => onNavigate(Navigate.TODAY)}
          size={isMobile ? "small" : "medium"}
          variant="outlined"
          sx={{
            textTransform: "none",
            px: 2,
            borderColor: "var(--primary)",
            color: "var(--primary)",
            "&:hover": { borderColor: "var(--primary-hover)" },
          }}
        >
          Today
        </Button>
        <IconButton
          onClick={() => onNavigate(Navigate.NEXT)}
          size={isMobile ? "small" : "medium"}
          sx={{
            color: "var(--primary)",
            px: 2,
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
          order: isMobile ? 1 : 2,
          textAlign: "center",
          background:
            "linear-gradient(45deg, var(--primary), var(--secondary))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          order: 3,
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "center" : "flex-end",
        }}
      >
        <Button
          onClick={() => onView(Views.MONTH)}
          variant={view === Views.MONTH ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            minWidth: isMobile ? 60 : 80,
            borderRadius: "8px",
            bgcolor: view === Views.MONTH ? "var(--primary)" : "transparent",
            color: view === Views.MONTH ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === Views.MONTH
                  ? "var(--primary-hover)"
                  : "var(--background)",
            },
          }}
        >
          Month
        </Button>

        <Button
          onClick={() => onView(Views.WEEK)}
          variant={view === Views.WEEK ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            minWidth: isMobile ? 60 : 80,
            borderRadius: "8px",
            bgcolor: view === Views.WEEK ? "var(--primary)" : "transparent",
            color: view === Views.WEEK ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === Views.WEEK
                  ? "var(--primary-hover)"
                  : "var(--background)",
            },
          }}
        >
          Week
        </Button>

        <Button
          onClick={() => onView(Views.DAY)}
          variant={view === Views.DAY ? "contained" : "outlined"}
          sx={{
            textTransform: "capitalize",
            minWidth: isMobile ? 60 : 80,
            borderRadius: "8px",
            bgcolor: view === Views.DAY ? "var(--primary)" : "transparent",
            color: view === Views.DAY ? "white" : "var(--text)",
            borderColor: "var(--divider)",
            "&:hover": {
              bgcolor:
                view === Views.DAY
                  ? "var(--primary-hover)"
                  : "var(--background)",
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
