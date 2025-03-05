import { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Typography, Box, Stack } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <Container
      maxWidth="md"
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
          boxShadow: 3,
          textAlign: "center",
          width: "100%",
        }}
      >
        <Typography
          variant="h1"
          sx={{ fontSize: "4rem", mb: 2, color: "primary.main" }}
        >
          404 :(
        </Typography>
        <Typography variant="h4" gutterBottom>
          Sadly, Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          ByteMates keep changing stuff so the page you&apos;re looking for
          either doesn&apos;t exist or has been destroyed (more likely).
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            component={Link}
            href="/dashboard"
            sx={{ px: 4, py: 1.5 }}
          >
            Go Vamoose!
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
