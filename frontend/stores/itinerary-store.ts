import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";
import {
  ItineraryEvent,
  ItineraryEventsResponse,
} from "../app/trips/[tripId]/sections/Itinerary/types";

interface ItineraryState {
  itineraryEvents: ItineraryEvent[];
  loading: boolean;
  error: string | null;

  fetchItineraryEvents: (tripId: number) => Promise<void>;
  addItineraryEvent: (event: ItineraryEvent) => void;
  updateItineraryEvent: (event: ItineraryEvent) => void;
  deleteItineraryEvent: (eventId: number) => void;
  resetItineraryError: () => void;
}

export const useItineraryStore = create<ItineraryState>((set) => ({
  itineraryEvents: [],
  loading: false,
  error: null,

  fetchItineraryEvents: async (tripId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${tripId}/itinerary-events`);
      const data: ItineraryEventsResponse = response.data;
      set({ itineraryEvents: data.itineraryEvents, loading: false });
    } catch (error) {
      let errorMessage = "Failed to load itinerary events";
      if (error instanceof AxiosError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({ error: errorMessage, loading: false });
    }
  },

  addItineraryEvent: (event: ItineraryEvent) =>
    set((state) => ({
      itineraryEvents: [event, ...state.itineraryEvents],
    })),

  updateItineraryEvent: (event: ItineraryEvent) =>
    set((state) => ({
      itineraryEvents: state.itineraryEvents.map((e) =>
        e.id === event.id ? event : e
      ),
    })),

  deleteItineraryEvent: (eventId: number) =>
    set((state) => ({
      itineraryEvents: state.itineraryEvents.filter((e) => e.id !== eventId),
    })),

  resetItineraryError: () => set({ error: null }),
}));
