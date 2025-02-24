"use client";

import InviteModal from "@/components/InviteModal";
import { GroupAdd } from "@mui/icons-material";
import { Box, Typography, Divider, Button } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TripMembers() {

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const handleOpenInviteModal = () => {
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite === "true") {
      handleOpenInviteModal();
      router.replace(`${pathname}`);
    }
  }, [pathname, router, searchParams]);
  
  return (
    <>
      <Box>
        <Box
        sx={{
          display: "flex",
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "100%", 
          mb: 3, 
        }}
      >
        {/* Header */}
          <Typography variant="h5" fontWeight="bold">
            Trip Members
          </Typography>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<GroupAdd />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontSize: "0.8rem",
              }}
              onClick={handleOpenInviteModal} 
            >
              Invite More Explorers
            </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1">
          A list of all members included in this trip.
        </Typography>
      </Box>
      <InviteModal open={isInviteModalOpen} onClose={handleCloseInviteModal} />
    </>

  );
}
