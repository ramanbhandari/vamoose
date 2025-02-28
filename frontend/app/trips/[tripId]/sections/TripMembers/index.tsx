"use client";

import InviteModal from "@/components/InviteModal";
import { useUserStore } from "@/stores/user-store";
import { TripData } from "@/types";
import { getUserInfo } from "@/utils/userHelper";
import { GroupAdd } from "@mui/icons-material";
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
} from "@mui/material";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GradientHeader } from "../Overview/styled";
import { motion } from "framer-motion";
import MemberCard from "./MemberCard";

interface TripMemberProps {
  tripData: TripData | null;
}

export default function TripMembers({ tripData }: TripMemberProps) {
  const theme = useTheme();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isNotAllowedDialogOpen, setNotAllowedDialogOpen] = useState(false);

  const user = useUserStore((state) => state.user);
  const isLoading = !user || !tripData?.members;

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

  return (
    <Box>
      <GradientHeader
        theme={theme}
        sx={{
          background: tripData.imageUrl
            ? "none"
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,

          "&::after": tripData.imageUrl
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
              {tripData.name}
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

          <Box mt={4}>
            <Grid container spacing={2}>
              {tripData.members.map((member, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <MemberCard member={member} />
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
