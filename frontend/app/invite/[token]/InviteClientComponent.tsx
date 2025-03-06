"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Modal,
  Button,
  CircularProgress,
  Paper,
  Avatar,
  IconButton,
} from "@mui/material";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import apiClient from "@/utils/apiClient";
import { motion } from "framer-motion";
import CelebrationIcon from "@mui/icons-material/Celebration";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import DateRangeIcon from "@mui/icons-material/DateRange";
import GroupIcon from "@mui/icons-material/Group";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import { useNotificationStore } from "@/stores/notification-store";
import axios from "axios";
import { useUserStore } from "@/stores/user-store";

interface InviteDetails {
  inviter: string;
  invited: string;
  destination: string;
  from: string;
  to: string;
}

interface TripData {
  id: number;
  name: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Array<{ tripId: number; userId: string; role: string }>;
  expenses: Array<[]>;
  stays: Array<[]>;
  imageUrl: string;
}

interface InviteClientComponentProps {
  inviteInfo: InviteDetails;
  inviteToken: string | string[] | undefined;
}

export default function InviteClientComponent({
  inviteInfo: initialInviteInfo,
  inviteToken,
}: InviteClientComponentProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [wrongEmailError, setWrongEmailError] = useState<string | null>(null); 

  const { setNotification } = useNotificationStore();
  const { logoutUser } = useUserStore();

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Validate the invite if the user is authenticated
          const response = await apiClient.get(
            `/trips/1/invites/validate/${inviteToken}`
          );
          setTripData(response.data.trip);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setWrongEmailError(` This invite is for ${initialInviteInfo.invited}. Please login / signup with that email.`);
        } else {
          console.error("Error validating invite:", err);
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [initialInviteInfo.invited, inviteToken]);

  useEffect(()=>{
    return ()=> {sessionStorage.removeItem("loginInviteRedirect");}
  },[]);

  const handleLoginRedirect = async () => {
    if(user){
      await logoutUser();
    }
    sessionStorage.setItem("inviteRedirect", `/invite/${inviteToken}`);
    router.push("/login");
  };

  const handleAcceptInvite = async () => {
    setIsAccepting(true);
    try {
      await apiClient.post(`/trips/1/invites/accept/${inviteToken}`);
      setNotification("Invite accepted successfully!", "success");
      router.replace(`/trips/${tripData?.id}`);
    } catch (err) {
      console.error("Failed to accept invite:", err);
      setNotification("Failed to accept invite. Please try again.", "error");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInvite = async () => {
    setIsRejecting(true);
    try {
      await apiClient.post(`/trips/1/invites/reject/${inviteToken}`);
      setNotification("Invite rejected successfully!", "success");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Failed to reject invite:", err);
      setNotification("Failed to reject invite. Please try again.", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  // Helper function to format dates safely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toDateString();
  };

  if (loading) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return notFound();
  }

  if (!initialInviteInfo && !tripData) {
    return null;
  }

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
    >
      <Modal
        open={true}
        onClose={() => {}}
        disableEscapeKeyDown={isAccepting || isRejecting}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 500 },
            bgcolor: "background.paper",
            borderRadius: 4,
            boxShadow: 24,
            p: 4,
            outline: "none",
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "text.secondary",
            }}
            onClick={() => router.replace("/dashboard")}
            disabled={isAccepting || isRejecting}
          >
            <CloseIcon />
          </IconButton>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            {wrongEmailError ? ( 
              <>
                <Typography
                  variant="h6"
                  color="error"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  Oops!
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, maxWidth: "80%" }}
                >
                  {wrongEmailError}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleLoginRedirect}
                  disabled={loading}
                  sx={{ mt: 2, borderRadius: 2, py: 1.5 }}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Login / Signup to Join"
                  )}
                </Button>
              </>
            ) : (
              // Show the regular invite content if no wrongEmailError
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      mb: 2,
                    }}
                  >
                    <CelebrationIcon fontSize="large" />
                  </Avatar>
                </motion.div>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  You&apos;re Invited!
                </Typography>
                {!user ? (
                  <>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      <strong>{initialInviteInfo.inviter}</strong> has invited you
                      to join an amazing trip!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      This invite is for <strong>{initialInviteInfo.invited}</strong>. Please login / signup with that email.
                    </Typography>
                    <Paper
                      sx={{
                        p: 3,
                        mt: 3,
                        width: "100%",
                        bgcolor: "background.default",
                        borderRadius: 2,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <PlaceIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Destination:</strong>{" "}
                          {initialInviteInfo.destination}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <DateRangeIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Dates:</strong>{" "}
                          {formatDate(initialInviteInfo.from)} -{" "}
                          {formatDate(initialInviteInfo.to)}
                        </Typography>
                      </Box>
                    </Paper>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleLoginRedirect}
                      disabled={loading}
                      sx={{ mt: 3, borderRadius: 2, py: 1.5 }}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Login / Signup to Join"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      <strong>{initialInviteInfo.inviter}</strong> has invited you
                      to join an amazing trip to{" "}
                      <strong>{tripData?.destination}</strong>!
                    </Typography>
                    <Paper
                      sx={{
                        p: 3,
                        mt: 3,
                        width: "100%",
                        bgcolor: "background.default",
                        borderRadius: 2,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <PlaceIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Destination:</strong>{" "}
                          {tripData?.destination || "N/A"}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <DateRangeIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Dates:</strong> {formatDate(tripData?.startDate)}{" "}
                          - {formatDate(tripData?.endDate)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <GroupIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Members:</strong> {tripData?.members.length || 0}{" "}
                          adventurers
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <LocalAtmIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Budget:</strong> $
                          {tripData?.budget.toLocaleString() || "N/A"}
                        </Typography>
                      </Box>
                      {tripData?.description && (
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <DescriptionIcon color="primary" />
                          <Typography variant="body1">
                            <strong>Description:</strong> {tripData.description}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                    <Box display="flex" gap={2} mt={3} width="100%">
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={handleAcceptInvite}
                        disabled={isAccepting || isRejecting}
                        sx={{ borderRadius: 2, py: 1.5 }}
                      >
                        {isAccepting ? <CircularProgress size={24} /> : "Accept"}
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        onClick={handleRejectInvite}
                        disabled={isAccepting || isRejecting}
                        sx={{ borderRadius: 2, py: 1.5 }}
                      >
                        {isRejecting ? <CircularProgress size={24} /> : "Reject"}
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}