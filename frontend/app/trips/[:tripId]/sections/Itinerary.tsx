import { Box, Typography, Divider } from "@mui/material";

export default function Itinerary() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Itinerary
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">Itinerary included in this trip.</Typography>
    </Box>
  );
}
