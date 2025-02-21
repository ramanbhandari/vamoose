import { Box, Typography, Divider } from "@mui/material";

export default function Dates() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Dates
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">Start Date: TBA</Typography>
      <Typography variant="body1">End Date: TBA</Typography>
    </Box>
  );
}
