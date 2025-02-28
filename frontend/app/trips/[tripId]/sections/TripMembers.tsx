"use client";

import InviteModal from "@/components/InviteModal";
import { GroupAdd } from "@mui/icons-material";
import {
  Box,
  Typography,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import { User } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface TripMemberProps {
  members: Array<{ tripId: number; userId: string; role: string }> | undefined;
  user: User | null;
}

export default function TripMembers({ members, user }: TripMemberProps) {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const isLoading = !user || !members;

  const currentUser = members?.find((member) => member.userId === user?.id);
  // const otherMembers = members?.filter(member => member.userId !== user?.id);

  const canInviteUsers = useCallback(() => {
    return currentUser?.role === "creator" || currentUser?.role === "admin";
  }, [currentUser]);

  const handleOpenInviteModal = useCallback(() => {
    if (canInviteUsers()) {
      setInviteModalOpen(true);
    }
  }, [canInviteUsers]);

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
  }, [handleOpenInviteModal, pathname, router, searchParams]);

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box className="flex items-center justify-between w-full mb-6">
          <Typography variant="h5" fontWeight="bold">
            Trip Members
          </Typography>
          {canInviteUsers() && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<GroupAdd />}
              className="rounded-full py-1.5 text-sm"
              onClick={handleOpenInviteModal}
            >
              Invite More Explorers
            </Button>
          )}
        </Box>
        <Divider className="my-2" />
        <Typography variant="body1">
          A list of all members included in this trip.
        </Typography>
      </Box>
      <InviteModal open={isInviteModalOpen} onClose={handleCloseInviteModal} />
    </>
  );
}
