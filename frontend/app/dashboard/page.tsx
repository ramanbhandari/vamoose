"use client";

/**
 * @file page.tsx
 * @description Displays and manages user trips with image preloading and responsive UI.
 */

import { useEffect, useState } from "react";
import TripCard from "../../components/TripCard";
import CreateTripButton from "../../components/CreateTripButton";
import { Box, Grid, Typography, useMediaQuery, useTheme } from "@mui/material";
import GridMotion from "../../components/blocks/Backgrounds/GridMotion/GridMotion";
import Image from "next/image";
import DashboardSkeleton from "./Skeleton";
import { useNotificationStore } from "@/stores/notification-store";
import { getMessages } from "./messages";
import { useUserTripsStore } from "@/stores/user-trips-store";

const items = [
  "/dashboard/dashboard_1.jpg",
  "/dashboard/dashboard_2.jpg",
  "/dashboard/dashboard_3.jpg",
  "/dashboard/dashboard_4.jpg",
  "/dashboard/dashboard_5.jpg",
  "/dashboard/dashboard_6.jpg",
  "/dashboard/dashboard_7.jpg",
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
];

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    currentTrips,
    upcomingTrips,
    pastTrips,
    loading,
    fetchUserTrips,
    deleteTrip,
  } = useUserTripsStore();

  const [preloaded, setPreloaded] = useState(false);
  const { setNotification } = useNotificationStore();

  // this useEffect fetches Trips data and images
  useEffect(() => {
    const fetchDataAndPreload = async () => {
      try {
        await Promise.all([
          fetchUserTrips("current"),
          fetchUserTrips("upcoming"),
          fetchUserTrips("past"),
        ]);
        if (!preloaded) {
          await preloadImages(items);
          setPreloaded(true);
        }
      } catch (error) {
        setNotification(
          "Error fetching trips, please refresh or login again",
          "error"
        );
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

  const handleTripDelete = (deletedTripId: number) => {
    deleteTrip(deletedTripId);
  };

  // skeleton resembling our acutal page
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "60vh",
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
            {getMessages.welcome}
          </Typography>
          <Typography
            variant={isMobile ? "body1" : "h6"}
            sx={{
              textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
            }}
          >
            {getMessages.tagline}
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
            {getMessages.currentTrips}
          </Typography>
          {currentTrips.length > 0 ? (
            <Grid container spacing={3}>
              {currentTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard tripData={trip} onDelete={handleTripDelete} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              {getMessages.noCurrentTrips}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {getMessages.futureTrips}
          </Typography>
          {upcomingTrips.length > 0 ? (
            <Grid container spacing={3}>
              {upcomingTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard tripData={trip} onDelete={handleTripDelete} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              {getMessages.noUpcomingTrips}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {getMessages.pastTrips}
          </Typography>
          {pastTrips.length > 0 ? (
            <Grid container spacing={3}>
              {pastTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard tripData={trip} onDelete={handleTripDelete} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              {getMessages.noPastTrips}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
