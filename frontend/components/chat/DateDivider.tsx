import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { format, isToday, isYesterday } from "date-fns";

interface DateDividerProps {
  date: Date;
}

const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  const year = date.getFullYear();
  const isYear = year === new Date().getFullYear();
  const formatDateLabel = (date: Date): string => {
    if (isToday(date)) {
      return `Today, ${format(date, "MMM d")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "MMM d")}`;
    } else if (isYear) {
      return format(date, "EEEE, MMM d");
    } else {
      return format(date, "EEEE, MMM d, yyyy");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        my: 2,
        opacity: 1,
        animation: "fadeIn 0.5s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0 },
          "100%": { opacity: 0.8 },
        },
      }}
    >
      <Divider sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        sx={{
          mx: 2,
          px: 2,
          py: 0.5,
          borderRadius: 4,
          backgroundColor: "var(--background-paper)",
          fontWeight: "medium",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {formatDateLabel(date)}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
};

export default DateDivider;
