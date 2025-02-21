import { Box, Typography, Divider } from "@mui/material";

export default function TripMembers() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Trip Members
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        A list of all members included in this trip.
      </Typography>
    </Box>
  );
}
