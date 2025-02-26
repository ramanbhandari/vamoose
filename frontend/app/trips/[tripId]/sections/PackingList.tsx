import { Box, Typography, Divider } from "@mui/material";

export default function PackingList() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Packing List
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">
        Packing List included in this trip.
      </Typography>
    </Box>
  );
}
