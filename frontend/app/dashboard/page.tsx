"use client";

import { useEffect, useState } from "react";
import TripCard from "../../components/TripCard";
import CreateTripButton from "../../components/CreateTripButton";
import { Box, Grid, Typography, useMediaQuery, useTheme } from "@mui/material";
import GridMotion from "../../components/blocks/Backgrounds/GridMotion/GridMotion";
import Image from "next/image";
import apiClient from "@/utils/apiClient";
import { format, parseISO } from "date-fns";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase/client";
import DashboardSkeleton from "./Skeleton";

const formatDate = (dateString?: string) => {
  if (!dateString) return "No date provided";

  const date = parseISO(dateString);
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  return format(localDate, "MMM dd, yyyy");
};

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
];

interface TripData {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Array<{ tripId: number; userId: string; role: string }>;
  expenses: Array<[]>;
  stays: Array<[]>;
  imageUrl?: string;
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // set loading true so we can first load everything before we show the whole page
  const [loading, setLoading] = useState(true);
  //current user
  const [user, setUser] = useState<User | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<TripData[]>([]);
  const [pastTrips, setPastTrips] = useState<TripData[]>([]);
  const [currentTrips, setCurrentTrips] = useState<TripData[]>([]);

  const [preloaded, setPreloaded] = useState(false);

  // this useEffect fetches Trips data and images
  useEffect(() => {
    const fetchDataAndPreload = async () => {
      try {
        // API call for current trips
        const currentResponse = await apiClient.get(`/trips`, {
          params: { status: "current" },
        });
        // API call for upcoming trips
        const upcomingResponse = await apiClient.get(`/trips`, {
          params: { status: "future" },
        });

        // API call for past trips
        const pastResponse = await apiClient.get(`/trips`, {
          params: { status: "past" },
        });

        setUpcomingTrips(upcomingResponse.data.trips || []);
        setPastTrips(pastResponse.data.trips || []);
        setCurrentTrips(currentResponse.data.trips || []);

        if (!preloaded) {
          await preloadImages(items);
          setPreloaded(true);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false);
      }
    };

    fetchDataAndPreload();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
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
    setUpcomingTrips((trips) => trips.filter((t) => t.id !== deletedTripId));
    setPastTrips((trips) => trips.filter((t) => t.id !== deletedTripId));
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
            Current Trips
          </Typography>
          {currentTrips.length > 0 ? (
            <Grid container spacing={3}>
              {currentTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard
                    tripId={trip.id}
                    title={trip.name}
                    startDate={formatDate(trip.startDate)}
                    endDate={formatDate(trip.endDate)}
                    destination={trip.destination}
                    imageUrl={trip.imageUrl}
                    onDelete={handleTripDelete}
                    userId={user?.id ?? ""}
                    tripData={trip}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              No current trips found.
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Upcoming Trips
          </Typography>
          {upcomingTrips.length > 0 ? (
            <Grid container spacing={3}>
              {upcomingTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard
                    tripId={trip.id}
                    title={trip.name}
                    startDate={formatDate(trip.startDate)}
                    endDate={formatDate(trip.endDate)}
                    destination={trip.destination}
                    imageUrl={trip.imageUrl}
                    onDelete={handleTripDelete}
                    userId={user?.id ?? ""}
                    tripData={trip}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              No upcoming trips found.
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Past Trips
          </Typography>
          {pastTrips.length > 0 ? (
            <Grid container spacing={3}>
              {pastTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TripCard
                    tripId={trip.id}
                    title={trip.name}
                    startDate={formatDate(trip.startDate)}
                    endDate={formatDate(trip.endDate)}
                    destination={trip.destination}
                    imageUrl={trip.imageUrl}
                    onDelete={handleTripDelete}
                    userId={user?.id ?? ""}
                    tripData={trip}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
              No past trips found.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
