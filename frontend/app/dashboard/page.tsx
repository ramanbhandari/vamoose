"use client";

import { useEffect, useState } from "react";
import TripCard from "../../components/TripCard";
import CreateTripButton from "../../components/CreateTripButton";
import {
  Box,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Skeleton,
} from "@mui/material";
import GridMotion from "../../components/blocks/Backgrounds/GridMotion/GridMotion";
import Image from "next/image";

const upcomingTrips = [
  {
    title: "Trip to Tokyo",
    description: "Cherry blossoms & sushi!",
    date: "2025-03-15",
  },
  {
    title: "Weekend in Rome",
    description: "Pizza, pasta & Colosseum!",
    date: "2025-04-28",
  },
  {
    title: "New York Adventure",
    description: "City lights & Broadway",
    date: "2025-08-21",
  },
  {
    title: "New York Adventure",
    description: "City lights & Broadway",
    date: "2025-08-21",
  },
  {
    title: "New York Adventure",
    description: "City lights & Broadway",
    date: "2025-08-21",
  },
];

const pastTrips = [
  {
    title: "Hiking in Swiss Alps",
    description: "Breathtaking views!",
    date: "2025-08-21",
  },
  {
    title: "Paris Getaway",
    description: "Eiffel Tower & croissants",
    date: "2025-08-21",
  },
];

const items = [
  "/dashboard/dashboard_1.jpg",
  "/dashboard/dashboard_2.jpg",
  "/dashboard/dashboard_3.jpg",
  "/dashboard/dashboard_4.jpg",
  "/dashboard/dashboard_5.jpg",
  "/dashboard/dashboard_6.jpg",
  "/dashboard/dashboard_7.avif",
  "/dashboard/dashboard_8.jpg",
  "/dashboard/dashboard_9.jpg",
  "/dashboard/dashboard_10.jpg",
  "/dashboard/dashboard_13.jpg",
  "/dashboard/dashboard_14.jpg",
  "/dashboard/dashboard_15.jpg",
  "/dashboard/dashboard_11.jpg",
  "/dashboard/dashboard_12.jpg",
  "/dashboard/dashboard_16.jpg",
  "/dashboard/dashboard_17.jpg",
  "/dashboard/dashboard_18.jpg",
  "/dashboard/dashboard_19.jpg",
  "/dashboard/dashboard_20.jpg",
  "/dashboard/dashboard_21.jpg",
  "/dashboard/dashboard_22.jpg",
  "/dashboard/dashboard_23.jpg",
];

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // set loading true so we can first load everything before we show the whole page
  const [loading, setLoading] = useState(true);

  // this useEffect fetches images [ TODO - add API calls to fetch user's trip data later]
  useEffect(() => {
    const fetchDataAndPreload = async () => {
      try {
        // TODO API calls here for trip data
        await preloadImages(items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchDataAndPreload();
  }, []);
  // preload images since we have quite a lot
  const preloadImages = (urls: string[]): Promise<void[]> => {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  };
  // skeleton resembling our acutal page
  if (loading) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: isMobile ? "40vh" : "60vh",
        }}
      >
        {isMobile ? (
          <Image
            src="/dashboard/dashboard_13.jpg"
            alt="Static Background"
            fill
            priority
            className="object-cover"
          />
        ) : (
          <GridMotion items={items} gradientColor="background.primary" />
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "8vh",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 20%, var(--background) 90%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

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
          <Typography
            variant={isMobile ? "h4" : "h2"}
            sx={{
              fontWeight: 700,
              mb: 2,
              textShadow: "3px 3px 8px rgba(0,0,0,0.7)",
            }}
          >
            Welcome to Vamoose!
          </Typography>
          <Typography
            variant={isMobile ? "body1" : "h6"}
            sx={{
              textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
            }}
          >
            Your personalized trip planner for all your adventures.
          </Typography>
          <Box
            sx={{
              textAlign: "center",
              mt: 2,
              width: isMobile ? "60%" : "100%",
              mx: "auto",
            }}
          >
            <CreateTripButton />
          </Box>
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Upcoming Trips
          </Typography>
          <Grid container spacing={3}>
            {upcomingTrips.map((trip, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <TripCard
                  title={trip.title}
                  description={trip.description}
                  date={trip.date}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Past Trips
          </Typography>
          <Grid container spacing={3}>
            {pastTrips.map((trip, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <TripCard
                  title={trip.title}
                  description={trip.description}
                  date={trip.date}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
