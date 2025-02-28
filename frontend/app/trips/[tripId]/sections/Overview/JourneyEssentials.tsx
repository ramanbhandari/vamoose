"use client";

import { DateRange, Explore, Hotel, Luggage, Work } from "@mui/icons-material";
import {
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { SectionContainer } from "./styled";

interface AdventureCardProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  onClick?: () => void;
}

function AdventureCard({ icon, title, status, onClick }: AdventureCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          height: "100%",
          transition: "all 0.3s ease",
          cursor: "pointer",
          backgroundColor: "background.default",
          "&:hover": {
            boxShadow: 6,
          },
        }}
        onClick={onClick}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <IconButton
            sx={{
              mb: 2,
              fontSize: "2.5rem",
              color: "primary.main",
              bgcolor: "action.hover",
              borderRadius: 3,
            }}
          >
            {icon}
          </IconButton>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Chip
            label={status}
            color="secondary"
            size="medium"
            sx={{
              fontWeight: 600,
              px: 2,
              borderRadius: 2,
            }}
          />
        </Box>
      </Paper>
    </motion.div>
  );
}

interface JourneyEssentialsProps {
  onSectionChange: (sectionId: string) => void;
}

export default function JourneyEssentials({
  onSectionChange,
}: JourneyEssentialsProps) {
  const theme = useTheme();
  const items = [
    {
      id: "stays",
      icon: <Hotel fontSize="large" />,
      title: "Stays",
      status: `3 Booked`,
    },
    {
      id: "activities",
      icon: <Explore fontSize="large" />,
      title: "Activities",
      status: "5 Planned",
    },
    {
      id: "packing",
      icon: <Luggage fontSize="large" />,
      title: "Packing List",
      status: "In Progress",
    },
    {
      id: "itinerary",
      icon: <DateRange fontSize="large" />,
      title: "Itinerary",
      status: "Draft",
    },
  ];

  return (
    <SectionContainer theme={theme}>
      <Box mb={3}>
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
          <Work fontSize="large" />
          Journey Essentials
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Key components of your upcoming adventure
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {items.map((item, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <AdventureCard {...item} onClick={() => onSectionChange(item.id)} />
          </Grid>
        ))}
      </Grid>
    </SectionContainer>
  );
}
