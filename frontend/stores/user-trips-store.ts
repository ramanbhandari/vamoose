import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { TripData } from "./trip-store";
import { AxiosError } from "axios";

interface UserTripsState {
  currentTrips: TripData[];
  upcomingTrips: TripData[];
  pastTrips: TripData[];
  loading: boolean;
  error: string | null;

  fetchUserTrips: (category: "current" | "upcoming" | "past") => Promise<void>;
  getAllTrips: () => TripData[];
  deleteTrip: (tripId: number) => void;
}

export const useUserTripsStore = create<UserTripsState>((set, get) => ({
  currentTrips: [],
  upcomingTrips: [],
  pastTrips: [],
  loading: false,
  error: null,

  fetchUserTrips: async (category) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/trips`, {
        params: { status: category === "upcoming" ? "future" : category },
      });

      set({
        [`${category}Trips`]: response.data.trips,
        loading: false,
      });
    } catch (error) {
      let errorMessage = "Failed to load trips";

      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          errorMessage = "No trips found.";
        } else if (error.response?.status === 403) {
          errorMessage = "You do not have permission to view trips.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, loading: false });
    }
  },
  getAllTrips: () => {
    const { currentTrips, upcomingTrips, pastTrips } = get();
    return [...currentTrips, ...upcomingTrips, ...pastTrips];
  },
  deleteTrip: (tripId) => {
    set((state) => ({
      currentTrips: state.currentTrips.filter((t) => t.id !== tripId),
      upcomingTrips: state.upcomingTrips.filter((t) => t.id !== tripId),
      pastTrips: state.pastTrips.filter((t) => t.id !== tripId),
    }));
  },
}));
