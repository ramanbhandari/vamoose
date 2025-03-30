"use client";

import {
  Box,
  Typography,
  Button,
  useTheme,
  Paper,
  Avatar,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { CalendarToday, Person } from "@mui/icons-material";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";
import Masonry from "@mui/lab/Masonry";
import { EventCategory, ItineraryEvent } from "../Itinerary/types";
import { CategoryIcon } from "../Itinerary/ListView/EventCard";
import { parseLocalDateWithTime } from "@/utils/dateFormatter";

export const categories = [
  { label: "MEAL", color: "#F59E0B" },
  {
    label: "TRAVEL",
    color: "#ff696d",
  },

  {
    label: "ACTIVITY",
    color: "#14B8A6",
  },
  {
    label: "GENERAL",
    color: "#3B82F6",
  },
  {
    label: "MEETING",
    color: "#8B5CF6",
  },
  {
    label: "FREE_TIME",
    color: "#8B5CF6",
  },
  {
    label: "OTHER",
    color: "#8B5CF6",
  },
];

interface ItineraryCardProps {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  createdBy: string;
  startTime: string;
  endTime: string;
  onClick?: () => void;
}

function ItineraryPreviewCard({
  title,
  description,
  category,
  createdBy,
  startTime,
  endTime,
  onClick,
}: ItineraryCardProps) {
  const theme = useTheme();

  return (
    <motion.div whileHover={{ y: -5 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          transition: "all 0.3s ease",
          cursor: "pointer",
          backgroundColor: "background.default",
          "&:hover": {
            boxShadow: 6,
          },
        }}
        onClick={onClick}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: categories.find((c) => c.label === category)?.color,
              color: "white",
            }}
          >
            {CategoryIcon[category]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="h6" fontWeight="600">
                {title}
              </Typography>
              <Chip
                label={category}
                size="small"
                sx={{
                  bgcolor:
                    categories.find((c) => c.label === category)?.color + "22",
                  color: categories.find((c) => c.label === category)?.color,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
              }}
            >
              <Typography
                variant="body2"
                fontWeight="600"
                color={theme.palette.primary.main}
              >
                {parseLocalDateWithTime(startTime)?.toDateString()}
                {", "}
                {new Date(startTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(endTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
              }}
            >
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Created by {createdBy}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

interface ItinerarySectionProps {
  itineraryEvents: ItineraryEvent[];
  onSectionChange: (sectionId: string) => void;
}

export default function ItinerarySection({
  itineraryEvents,
  onSectionChange,
}: ItinerarySectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const MAX_EVENTS = 4;

  return (
    <SectionContainer theme={theme}>
      <Box
        mb={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CalendarToday fontSize="large" />
            Itinerary Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {itineraryEvents.length} event(s)
          </Typography>
        </Box>

        {!isMobile && (
          <Box>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
                onClick={() => onSectionChange("itinerary")}
              >
                View All Planned Events
              </Button>
            </motion.div>
          </Box>
        )}
      </Box>

      <Masonry columns={isMobile ? 1 : 2} spacing={2}>
        {itineraryEvents.slice(0, MAX_EVENTS).map((event) => (
          <ItineraryPreviewCard
            key={event.id}
            id={event.id}
            title={event.title}
            description={event.description ?? ""}
            category={event.category}
            createdBy={event.createdBy.fullName}
            startTime={event.startTime}
            endTime={event.endTime}
            onClick={() => onSectionChange("itinerary")}
          />
        ))}
      </Masonry>
      {isMobile && (
        <Box
          sx={{
            mt: 3,
            mx: "auto",
          }}
        >
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontSize: "1.1rem",
              }}
              onClick={() => onSectionChange("itinerary")}
            >
              {itineraryEvents.length > 0
                ? " View All Planned Events"
                : "Go to Itinerary"}
            </Button>
          </motion.div>
        </Box>
      )}
    </SectionContainer>
  );
}
