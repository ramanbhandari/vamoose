/** 
 * @file page.tsx 
 * @description A page component for resetting the user's password. It handles session validation, password change, and error handling.
 */


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { useNotificationStore } from "@/stores/notification-store";
import { useUserStore } from "@/stores/user-store";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { setNotification } = useNotificationStore();
  const { fetchUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // this route can't be protected, we will check for valid session from redirect url and proceed accordingly
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setLoading(false);
        } else {
          setNotification("Invalid or expired password reset link", "error");
          router.push("/login");
        }
      } catch (err) {
        console.error("Session check error: ", err);
        setNotification("Error validating reset link", "error");
        router.push("/account");
      }
    };

    checkRecoverySession();
  }, [router, setNotification]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      await fetchUser();

      // redirect to account page since thats where they initially came from
      setNotification("Password updated successfully!", "success");
      router.push("/account");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        setNotification(err.message, "error");
      }
    }
  };

  if (loading) {
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
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

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
        <Stack component="form" spacing={3} onSubmit={handlePasswordReset}>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Reset Password
          </Typography>

          {error && (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          )}

          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: "secondary.main" }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: "secondary.main" }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              py: 1.5,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Update Password
          </Button>

          <Button
            variant="outlined"
            onClick={() => router.push("/account")}
            fullWidth
            sx={{
              borderColor: "secondary.main",
              color: "secondary.main",
              "&:hover": { borderColor: "primary.main", color: "primary.main" },
            }}
          >
            Back to Account
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
