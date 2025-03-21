"use client";

import { create } from "zustand";
import socketClient from "@/utils/socketClient";
import type { Message } from "@/stores/message-store";
import { TripData } from "./trip-store";

interface ChatNotificationState {
  joinedTripIds: string[];
  unreadCounts: Record<string, number>;
  lastMessages: Record<string, Message>;

  markTripJoined: (tripId: string) => void;
  hasJoinedTrip: (tripId: string) => boolean;

  incrementUnreadCount: (tripId: string, message?: Message) => void;
  clearUnreadCount: (tripId: string) => void;

  setLastMessage: (tripId: string, message: Message) => void;
  getTotalUnreadCount: () => number;

  joinAllTrips: (trips: TripData[]) => void;
}

export const useChatNotificationStore = create<ChatNotificationState>(
  (set, get) => ({
    joinedTripIds: [],
    unreadCounts: {},
    lastMessages: {},

    markTripJoined: (tripId: string) => {
      set((state) => {
        if (state.joinedTripIds.includes(tripId)) {
          return {};
        }
        return { joinedTripIds: [...state.joinedTripIds, tripId] };
      });
    },

    hasJoinedTrip: (tripId: string) => {
      return get().joinedTripIds.includes(tripId);
    },

    incrementUnreadCount: (tripId: string, message?: Message) => {
      set((state) => {
        const currentCount = state.unreadCounts[tripId] || 0;
        const newUnreadCounts = {
          ...state.unreadCounts,
          [tripId]: currentCount + 1,
        };
        const newLastMessages = message
          ? { ...state.lastMessages, [tripId]: message }
          : state.lastMessages;
        return {
          unreadCounts: newUnreadCounts,
          lastMessages: newLastMessages,
        };
      });
    },

    clearUnreadCount: (tripId: string) => {
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [tripId]: 0 },
      }));
    },

    setLastMessage: (tripId: string, message: Message) => {
      set((state) => ({
        lastMessages: { ...state.lastMessages, [tripId]: message },
      }));
    },

    getTotalUnreadCount: () => {
      const counts = get().unreadCounts;
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    },

    joinAllTrips: (trips: TripData[]) => {
      trips.forEach((trip) => {
        const tripIdStr = trip.id.toString();
        if (!get().hasJoinedTrip(tripIdStr)) {
          socketClient.joinTripChat(tripIdStr);
          get().markTripJoined(tripIdStr);
        }
      });
    },
  })
);
