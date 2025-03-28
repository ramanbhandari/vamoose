/**
 * @file DateHeader.tsx
 * @description A sticky header component that displays a formatted date above grouped itinerary events.
 *
 */

import { Typography, Box, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const DateHeader = ({ date }: { date: string }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        py: 2,
        backdropFilter: "blur(10px)",
        backgroundColor: alpha(theme.palette.background.default, 0.8),
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {new Date(date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Typography>
    </Box>
  );
};
