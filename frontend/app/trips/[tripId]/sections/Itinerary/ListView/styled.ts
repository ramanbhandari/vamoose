/**
 * @file styled.ts
 * @description Custom styled components for the itinerary timeline UI.
 */

import { Box, styled, alpha } from "@mui/material";

export const TimelineDot = styled(Box)(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  border: `3px solid ${theme.palette.background.default}`,
  position: "absolute",
  left: -8,
  top: 24,
  zIndex: 2,
}));

export const StyledEventCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.6)} 100%)`,
  backdropFilter: "blur(12px)",
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
  margin: theme.spacing(2, 0),
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: theme.shadows[4],
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));
