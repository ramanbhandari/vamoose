import { Box, Typography, Divider } from "@mui/material";

export default function Destinations() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Destinations
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        A list of all destinations included in this trip.
      </Typography>
    </Box>
  );
}
