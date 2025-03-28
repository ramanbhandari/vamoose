"use client";

/**
 * @file AuthForm.tsx
 * @description Authentication form for login, signup, and password reset with Supabase and Google OAuth integration.
 */

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import {
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Box,
  Container,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Google,
  Lock,
  Email,
  Visibility,
  VisibilityOff,
  Person,
  LockReset,
} from "@mui/icons-material";
import { getMessages } from "./messages";
import { useUserStore } from "@/stores/user-store";
import { useNotificationStore } from "@/stores/notification-store";

export default function AuthForm() {
  const { setNotification } = useNotificationStore();
  const { fetchUser } = useUserStore();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<"login" | "signup">("login");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRedirect = () => {
    const inviteRedirect = sessionStorage.getItem("inviteRedirect");
    if (inviteRedirect) {
      sessionStorage.removeItem("inviteRedirect"); // this giving RSC error in console which is a know issue in Nextjs, couldnt find any other fix
      // router.push(inviteRedirect);
      window.location.href = inviteRedirect;
    } else {
      // router.push("/dashboard"); // this giving RSC error in console which is a know issue in Nextjs, couldnt find any other fix
      window.location.href = "/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (formType === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (!displayName.trim()) {
          throw new Error(getMessages.displayNameError);
        }
        if (!email.trim()) throw new Error(getMessages.emailError);
        if (password !== confirmPassword)
          throw new Error(getMessages.passwordsUnmatchError);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });

        if (error) throw error;
      }
      // immediately feteh user so we keep the store updated
      await fetchUser();
      setNotification("Login successful. Welcome!", "success");

      handleRedirect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setError(null);
    try {
      if (!email.trim()) {
        throw new Error("Please enter your email address");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setNotification(
        "Password reset email sent. Check your inbox.",
        "success"
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setResetLoading(false);
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
        <Stack alignItems="center" spacing={1}>
          <Typography
            variant="h3"
            sx={{ color: "primary.main", fontFamily: "var(--font-brand)" }}
          >
            {getMessages.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "secondary.main", fontStyle: "italic" }}
          >
            {getMessages.tagline}
          </Typography>
        </Stack>

        <Tabs
          value={formType}
          onChange={(_, newValue) => setFormType(newValue)}
          variant="fullWidth"
          sx={{ my: 2 }}
        >
          <Tab label={getMessages.loginButton} value="login" />
          <Tab label={getMessages.signupButton} value="signup" />
        </Tabs>

        {error && (
          <Typography color="error" textAlign="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {formType === "signup" && (
            <TextField
              label="Display Name"
              type="text"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <Person sx={{ mr: 1, color: "secondary.main" }} />
                ),
              }}
            />
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: "secondary.main" }} />,
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: "secondary.main" }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {formType === "login" && (
            <Box sx={{ textAlign: "right", mt: -1 }}>
              <Button
                variant="text"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                startIcon={
                  resetLoading ? <CircularProgress size={16} /> : <LockReset />
                }
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8rem",
                  "&:hover": {
                    color: "primary.main",
                    bgcolor: "transparent",
                  },
                }}
              >
                Forgot Password?
              </Button>
            </Box>
          )}

          {formType === "signup" && (
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <Lock sx={{ mr: 1, color: "secondary.main" }} />
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={formLoading}
            sx={{
              py: 1.5,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {formLoading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : formType === "login" ? (
              getMessages.loginButton
            ) : (
              getMessages.signupButton
            )}
          </Button>
        </Box>

        <Typography textAlign="center" sx={{ mt: 2, color: "secondary.main" }}>
          {getMessages.socialLoginText}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Google />}
          onClick={handleGoogleLogin}
          disabled={formLoading}
          fullWidth
          sx={{
            mt: 1,
            borderColor: "secondary.main",
            color: "secondary.main",
            "&:hover": { borderColor: "primary.main", color: "primary.main" },
          }}
        >
          {formLoading ? (
            <CircularProgress size={20} />
          ) : (
            getMessages.googleButtonText
          )}
        </Button>

        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
          {formType === "login"
            ? getMessages.dontHaveAccount
            : getMessages.haveAnAccount}{" "}
          <Button
            variant="text"
            onClick={() =>
              setFormType(formType === "login" ? "signup" : "login")
            }
            sx={{ color: "primary.main" }}
          >
            {formType === "login"
              ? getMessages.signupButton
              : getMessages.loginButton}
          </Button>
        </Typography>
      </Box>
    </Container>
  );
}
