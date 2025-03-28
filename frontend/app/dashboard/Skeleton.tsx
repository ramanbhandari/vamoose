/**
 * @file DashboardSkeleton.tsx
 * @description Skeleton loader for the dashboard page, used to display loading states.
 */

import { Box, Grid, Skeleton, useMediaQuery, useTheme } from "@mui/material";

export default function DashboardSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: isMobile ? "40vh" : "60vh",
          overflow: "hidden",
        }}
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "white",
            zIndex: 10,
            width: "90%",
            maxWidth: "800px",
          }}
        >
          <Skeleton variant="text" width="60%" height={isMobile ? 40 : 60} />
          <Skeleton variant="text" width="80%" height={20} sx={{ mt: 2 }} />
          <Skeleton
            variant="rectangular"
            width={200}
            height={50}
            sx={{ mt: 3, mx: "auto" }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          p: { xs: 2, md: 4 },
          overflow: "auto",
          width: isMobile ? "100%" : "80%",
          mx: "auto",
        }}
      >
        <Box sx={{ mb: 5 }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={250}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[...Array(2)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={250}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
