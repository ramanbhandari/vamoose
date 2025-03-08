"use client";

import InviteModal from "@/components/InviteModal";
import { useUserStore } from "@/stores/user-store";
import { TripData } from "@/types";
import { getUserInfo } from "@/utils/userHelper";
import { DeleteOutline, GroupAdd } from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  DialogTitle,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  Container,
  useTheme,
  Checkbox,
  IconButton,
  Paper,
} from "@mui/material";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GradientHeader } from "../Overview/styled";
import { motion } from "framer-motion";
import MemberCard from "./MemberCard";
import { useTripStore } from "@/stores/trip-store";
import { useNotificationStore } from "@/stores/notification-store";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import apiClient from "@/utils/apiClient";

interface TripMemberProps {
  tripData: TripData | null;
}

export default function TripMembers({
  tripData: initialTripData,
}: TripMemberProps) {
  const theme = useTheme();
  const { setNotification } = useNotificationStore();

  // fetch tripData from our store if it exists, else use the props
  const {
    tripData: dataFromStore,
    fetchTripData,
    deleteMember,
    error,
  } = useTripStore();
  const tripData = initialTripData || dataFromStore;
  const [isLoading, setIsLoading] = useState(!tripData);

  useEffect(() => {
    if (tripData) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [tripData]);

  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // pendingDelete can be either a single user id or an array of string ids
  const [pendingDelete, setPendingDelete] = useState<string | string[] | null>(
    null
  );

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isNotAllowedDialogOpen, setNotAllowedDialogOpen] = useState(false);

  const user = useUserStore((state) => state.user);

  const userInfo = user ? getUserInfo(user) : null;
  const isCreator = userInfo?.isCreator(tripData);
  const isAdmin = userInfo?.isAdmin(tripData);

  const canInviteUsers = useCallback(() => {
    return isCreator || isAdmin;
  }, [isAdmin, isCreator]);

  const handleOpenInviteModal = useCallback(() => {
    if (canInviteUsers()) {
      setInviteModalOpen(true);
    } else {
      setNotAllowedDialogOpen(true);
    }
  }, [canInviteUsers]);

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
  };

  const handleCloseNotAllowedDialog = () => {
    setNotAllowedDialogOpen(false);
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
  // process the members of this trip to establish who they can delete based on roles heirarchy Creator -> Admin -> Member
  const processedMembers = tripData?.members.map((member) => {
    const isCurrentUser = member.userId === userInfo?.id;
    let deletable = false;
    let showCheckbox = false;

    if (userInfo) {
      const currentUserRole = userInfo.getRole(tripData);

      if (currentUserRole === "creator") {
        deletable =
          (member.role === "member" || member.role === "admin") &&
          !isCurrentUser; // Creator can delete anyone except themselves
        showCheckbox = deletable;
      } else if (currentUserRole === "admin") {
        deletable = member.role === "member" && !isCurrentUser;
        showCheckbox = deletable;
      }
    }

    return { ...member, deletable, showCheckbox };
  });

  const handleSelect = (userId: string) => {
    if (!processedMembers) return;
    const member = processedMembers.find((m) => m.userId === userId);

    // only allow selection for deletable
    if (!member || !member.deletable) return;

    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((item) => item !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (!processedMembers) return;
    // only allow selection for deletable
    const deletableMembers = processedMembers
      .filter((member) => member.deletable)
      .map((member) => member.userId);

    setSelected((prev) =>
      prev.length === deletableMembers.length ? [] : deletableMembers
    );
  };

  const handleRequestSingleDelete = (userId: string) => {
    setPendingDelete(userId);
    setConfirmOpen(true);
  };

  // Multiple deletion handler wrapped in confirmation
  const handleRequestMultipleDelete = () => {
    if (selected.length === 0) return;
    setPendingDelete(selected);
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!tripData || pendingDelete === null) return;
    setIsLoading(true);

    let response;
    try {
      if (Array.isArray(pendingDelete)) {
        response = await apiClient.delete(`/trips/${tripData.id}/members`, {
          data: { memberUserIds: pendingDelete },
        });
      } else {
        response = await apiClient.delete(
          `/trips/${tripData.id}/members/${pendingDelete}`
        );
      }

      const storeDelete = deleteMember(
        response.data.removedMembers
          ? response.data.removedMembers
          : pendingDelete
      );

      if (storeDelete !== null) {
        setNotification("Member(s) removed successfully!", "success");
      } else if (error) {
        setNotification(error, "error");
      }
      // Clear selection if multiple deletion
      if (Array.isArray(pendingDelete)) setSelected([]);
      await fetchTripData(tripData.id);
    } catch (error) {
      setNotification("Failed to delete member(s).", "error");
      setIsLoading(false);
      console.error("Error deleting member(s):", error);
    } finally {
      setIsLoading(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const deletableMembers =
    processedMembers?.filter((member) => member.deletable) || [];
  const deletableMembersCount = deletableMembers.length;

  return (
    <Box>
      <ConfirmationDialog
        open={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={
          Array.isArray(pendingDelete)
            ? `Are you sure you want to delete ${pendingDelete.length} Members?`
            : `Are you sure you want to remove this member?`
        }
      />
      <GradientHeader
        theme={theme}
        sx={{
          background: tripData?.imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

          "&::after": tripData?.imageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `url(${tripData.imageUrl}) center/cover no-repeat`,
                filter: "brightness(0.5) blur(4px)",
                zIndex: -2,
              }
            : "none",

          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              {tripData?.name}
            </Typography>

            <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                  width: "100%",
                  position: "relative",
                  [theme.breakpoints.up("md")]: {
                    justifyContent: "flex-end",
                  },
                }}
              >
                {canInviteUsers() && (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<GroupAdd />}
                      sx={{
                        borderRadius: 2,
                        fontSize: "1.1rem",
                      }}
                      onClick={handleOpenInviteModal}
                    >
                      Invite More Explorers
                    </Button>
                  </motion.div>
                )}
              </Box>
            </Grid>
          </Box>
        </Container>
      </GradientHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Your Travel Squad
          </Typography>

          {selected.length > 0 && (
            <Paper
              sx={{
                p: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "action.selected",
                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              }}
            >
              <Checkbox
                checked={
                  selected.length === deletableMembersCount &&
                  deletableMembersCount > 0
                }
                indeterminate={
                  selected.length > 0 && selected.length < deletableMembersCount
                }
                onChange={handleSelectAll}
              />
              <Typography variant="body2" color="text.secondary">
                {selected.length} selected
              </Typography>
              <IconButton color="error" onClick={handleRequestMultipleDelete}>
                <DeleteOutline />
              </IconButton>
            </Paper>
          )}

          <Box mt={4}>
            <Grid container spacing={2}>
              {processedMembers?.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.userId}>
                  <MemberCard
                    member={member}
                    checked={selected.includes(member.userId)}
                    onSelect={handleSelect}
                    onDelete={handleRequestSingleDelete}
                    showDelete={member.deletable}
                    showCheckbox={member.showCheckbox}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>

      <InviteModal open={isInviteModalOpen} onClose={handleCloseInviteModal} />

      <Dialog
        open={isNotAllowedDialogOpen}
        onClose={handleCloseNotAllowedDialog}
      >
        <DialogTitle>Not Authorized</DialogTitle>
        <DialogContent>
          <Typography>
            You cannot invite members because you are not the creator or an
            admin for this trip.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotAllowedDialog} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
