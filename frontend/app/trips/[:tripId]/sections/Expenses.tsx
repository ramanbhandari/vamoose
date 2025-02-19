import { Box, Typography, Divider } from "@mui/material";

export default function Expenses() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Expenses
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1">Expenses in this trip.</Typography>
    </Box>
  );
}
