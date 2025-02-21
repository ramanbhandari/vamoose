import { Box, Typography, Divider } from "@mui/material";

export default function Activities() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Activities
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        A list of all Activities included in this trip.
      </Typography>
    </Box>
  );
}
