"use client";

/** 
 * @file CreateTripButton.tsx 
 * @description A React component that renders a button to navigate users to the trip creation page. 
 * */

import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

export default function CreateTripButton() {
  const router = useRouter();

  return (
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      sx={{
        color: "#ffffff",
        "&:hover": {
          bgcolor: "primary.main",
          color: "#ffffff",
          borderColor: "primary.main",
        },
        fontWeight: 700,
        borderRadius: 2,
        py: 1.5,
        mt: 2,
        width: { xs: "100%", sm: "auto" },
        borderColor: "#ffffff",
        textShadow: "3px 3px 8px rgba(0,0,0,0.9)",
      }}
      onClick={() => router.push("/trips/create")}
    >
      Create New Trip
    </Button>
  );
}
