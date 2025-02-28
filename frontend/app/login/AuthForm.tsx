"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/icons-material";
import { getMessages } from "./messages";

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<"login" | "signup">("login");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRedirect = () => {
    const inviteRedirect = sessionStorage.getItem("inviteRedirect");
    if (inviteRedirect) {
      sessionStorage.removeItem("inviteRedirect");
      router.push(inviteRedirect);
    } else {
      router.push("/dashboard");
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
        if (password !== confirmPassword)
          throw new Error(getMessages.passwordsUnmatchError);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }

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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;

      handleRedirect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setFormLoading(false);
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
          {getMessages.googleButtonText}
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
