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
  Avatar,
  Divider,
} from "@mui/material";
import { Email, Person, LockReset, Edit, ArrowBack } from "@mui/icons-material";
import { supabase } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
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

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
          transform: "translateY(-5%)",
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            bgcolor: "primary.main",
            borderRadius: "50%",
            opacity: 0.4,
          },
          "&:after": {
            content: '""',
            position: "absolute",
            bottom: -80,
            left: -30,
            width: 150,
            height: 150,
            bgcolor: "secondary.main",
            borderRadius: "50%",
            opacity: 0.4,
          },
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push("/dashboard")}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          Dashboard
        </Button>
        <Stack spacing={3}>
          <Stack alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                fontSize: "2rem",
                mb: 2,
                boxShadow: 3,
              }}
            >
              {getInitials(user?.user_metadata?.display_name || "")}
            </Avatar>
            <Typography variant="h4" textAlign="center" fontWeight="bold">
              Account Settings
            </Typography>
            <Divider sx={{ width: "60%", my: 2 }} />
          </Stack>

          {error && (
            <Typography color="error" textAlign="center" variant="body2">
              {error}
            </Typography>
          )}

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: "action.hover",
              position: "relative",
            }}
          >
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <Person sx={{ verticalAlign: "middle", mr: 1 }} />
                Display Name
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1" sx={{ ml: 1.5 }}>
                  {user?.user_metadata?.display_name || "N/A"}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <Email sx={{ verticalAlign: "middle", mr: 1 }} />
                Email Address
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1" sx={{ ml: 1.5 }}>
                  {user?.email || "N/A"}
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
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
                  sx={{ flex: 1, py: 1.5 }}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} sx={{ color: "white" }} />
                    ) : (
                      <Person />
                    )
                  }
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ flex: 1, py: 1.5 }}
                >
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                onClick={handleEdit}
                sx={{ py: 1.5 }}
                startIcon={<Edit />}
              >
                Edit Profile
              </Button>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              onClick={handlePasswordReset}
              disabled={loading}
              fullWidth
              sx={{ py: 1.5 }}
              startIcon={<LockReset />}
              color="secondary"
            >
              Send Password Reset Email
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
