"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Email, Person } from "@mui/icons-material";
import { supabase } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { useNotificationStore } from "@/stores/notification-store";

export default function AccountPage() {
  const { user, fetchUser } = useUserStore();
  const { setNotification } = useNotificationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  useEffect(() => {
    if (user) {
      const displayName = user?.user_metadata?.display_name || "";
      const email = user?.email || "";

      setNewDisplayName(displayName);
      setNewEmail(email);
      setOriginalDisplayName(displayName);
      setOriginalEmail(email);
    }
  }, [user]);

  const handleSave = async () => {
    if (newDisplayName === originalDisplayName && newEmail === originalEmail) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updates = {
        email: newEmail,
        data: { display_name: newDisplayName },
      };

      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        setNotification(error.message, "error");
      } else {
        await fetchUser();
        setOriginalDisplayName(newDisplayName);
        setOriginalEmail(newEmail);
        setIsEditing(false);
        setNotification("Profile updated successfully!", "success");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setNotification(err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewDisplayName(originalDisplayName);
    setNewEmail(originalEmail);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setNewDisplayName(originalDisplayName);
    setNewEmail(originalEmail);
    setIsEditing(true);
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.email) {
        setNotification("No email found for user", "error");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setNotification(error.message, "error");
      } else {
        setNotification(
          "Password reset email sent. Check your inbox.",
          "success"
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 20px rgba(255, 255, 255, 0.3)"
              : "0 4px 20px rgba(0, 0, 0, 0.3)",
          width: "100%",
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4" textAlign="center">
            Account Settings
          </Typography>

          {error && (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          )}

          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Display Name
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Person sx={{ mr: 1, color: "secondary.main" }} />
                  ),
                }}
              />
            ) : (
              <Typography variant="h5">
                {user?.user_metadata?.display_name || "N/A"}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Email
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ mr: 1, color: "secondary.main" }} />
                  ),
                }}
              />
            ) : (
              <Typography variant="h5">{user?.email || "N/A"}</Typography>
            )}
          </Box>

          {isEditing ? (
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={
                  loading ||
                  (newDisplayName === originalDisplayName &&
                    newEmail === originalEmail)
                }
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={handleEdit} sx={{ py: 1.5 }}>
              Edit Profile
            </Button>
          )}

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Password
            </Typography>
            <Button
              variant="outlined"
              onClick={handlePasswordReset}
              disabled={loading}
              fullWidth
            >
              Send Password Reset Email
            </Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
