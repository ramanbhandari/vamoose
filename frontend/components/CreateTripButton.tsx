"use client";

import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function CreateTripButton() {
  return (
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      sx={{
        color: "#ededed",
        "&:hover": {
          bgcolor: "primary.main",
          color: "#ededed",
          borderColor: "primary.main",
        },
        fontWeight: 900,
        borderRadius: 2,
        py: 1.5,
        mt: 2,
        width: { xs: "100%", sm: "auto" },
        borderColor: "#ededed",
      }}
    >
      Create New Trip
    </Button>
  );
}
