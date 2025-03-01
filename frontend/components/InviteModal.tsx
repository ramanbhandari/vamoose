"use client";

import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useParams } from "next/navigation";
import apiClient from "@/utils/apiClient";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

interface ApiError {
  response: {
    data: {
      error: string;
      inviteUrl?: string;
    };
  };
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const params = useParams();
  const tripId = params.tripId as string;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleInvite = async () => {
    if (!email) {
      setError("Please enter an email address.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(`/trips/${tripId}/invites/create`, {
        email,
      });

      setInviteUrl(response.data.inviteUrl);
      setSnackbar({
        open: true,
        message:
          "Invite created successfully! Share this link with the explorer.",
        severity: "success",
      });
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.response?.data?.error === "Invite already exists.") {
        setInviteUrl(apiError.response?.data?.inviteUrl || "");
        setSnackbar({
          open: true,
          message:
            "An invite already exists for this email. Here's the link to share.",
          severity: "info",
        });
      } else {
        setSnackbar({
          open: true,
          message:
            apiError.response?.data?.error ||
            "Something went wrong. Please try again.",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setSnackbar({
      open: true,
      message: "Link copied to clipboard!",
      severity: "info",
    });
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setEmail("");
    setError("");
    setInviteUrl("");
    onClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Invite an Explorer
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {inviteUrl ? (
            // Display invite URL and copy button
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="body1" fontWeight={500}>
                Share this link with the explorer:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "background.default",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {inviteUrl}
                </Typography>
                <IconButton onClick={handleCopyInviteUrl} size="small">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ) : (
            // Display email field and invite button
            <>
              <TextField
                fullWidth
                label="Enter their email address"
                variant="outlined"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                error={!!error}
                helperText={error}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleInvite}
                disabled={loading}
              >
                {loading ? "Creating Invite..." : "Create Invite"}
              </Button>
            </>
          )}
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
