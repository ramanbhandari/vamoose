import { Box, Typography, Divider } from "@mui/material";

export default function Stays() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Stays
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        A list of all Stays included in this trip.
      </Typography>
    </Box>
  );
}
