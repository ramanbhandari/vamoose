import { Box, Typography, Divider } from "@mui/material";

export default function Polls() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Polls
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        A list of all Polls included in this trip.
      </Typography>
    </Box>
  );
}
