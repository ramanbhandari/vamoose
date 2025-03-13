"use client";

import { create } from "zustand";
import apiClient from "@/utils/apiClient";

import {
  HowToVote,
  AttachMoney,
  Group,
  Event,
  Schedule,
  Map,
  Notifications,
} from "@mui/icons-material";

export const NOTIFICATION_CATEGORIES = {
  polls: {
    icon: HowToVote,
    color: "primary.main",
  },
  expenses: {
    icon: AttachMoney,
    color: "success.main",
  },
  activities: {
    icon: Event,
    color: "warning.main",
  },
  itinerary: {
    icon: Map,
    color: "info.main",
  },
  members: {
    icon: Group,
    color: "secondary.main",
  },
  reminder: {
    icon: Schedule,
    color: "error.main",
  },
  default: {
    icon: Notifications,
    color: "text.primary",
  },
};

export const notificationSectionMapping: Record<
  string,
  { section: string; category: keyof typeof NOTIFICATION_CATEGORIES }
> = {
  POLL_CREATED: { section: "polls", category: "polls" },
  POLL_COMPLETED: { section: "polls", category: "polls" },
  EXPENSE_CREATED: { section: "expenses", category: "expenses" },
  EXPENSE_SHARE_SETTLED: { section: "expenses", category: "expenses" },
  MEMBER_JOINED: { section: "members", category: "members" },
};

export const getNotificationCategory = (type: string) => {
  const mapping = notificationSectionMapping[type] || { category: "default" };
  return (
    NOTIFICATION_CATEGORIES[mapping.category] || NOTIFICATION_CATEGORIES.default
  );
};

export interface UserNotification {
  id: number;
  userId: string;
  tripId: number | null;
  type: string;
  relatedId: number | null;
  channel: string | null;
  title: string;
  message: string;
  data: JSON | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface UserNotificationsState {
  notifications: UserNotification[];
  loading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;

  markAsRead: (notificationId: number) => Promise<void>;
  markManyAsRead: (notificationIds: number[]) => Promise<void>;
  deleteOne: (notificationId: number) => Promise<void>;
  deleteMany: (notificationIds: number[]) => Promise<void>;

  clearError: () => void;
}

export const useUserNotificationsStore = create<UserNotificationsState>(
  (set) => ({
    notifications: [],
    loading: false,
    error: null,
    channel: null,

    async fetchNotifications() {
      set({ loading: true, error: null });
      try {
        const response = await apiClient.get("/notifications");
        set({
          notifications: response.data.notifications || [],
          loading: false,
        });
      } catch (error) {
        const errorMessage = "Failed to load notifications: " + error;
        set({
          error: errorMessage,
          loading: false,
        });
      }
    },

    // Mark single as read
    async markAsRead(notificationId: number) {
      try {
        await apiClient.patch(`/notifications/${notificationId}/mark-as-read`);
        // update local state
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }));
      } catch (error) {
        const errorMessage = "Failed to mark notification as read: " + error;
        set({
          error: errorMessage,
        });
      }
    },

    // Mark multiple
    async markManyAsRead(notificationIds: number[]) {
      try {
        await apiClient.patch(`/notifications/mark-as-read`, {
          notificationIds,
        });
        // Update local state
        set((state) => ({
          notifications: state.notifications.map((n) =>
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          ),
        }));
      } catch (error) {
        const errorMessage = "Failed to mark notification as read: " + error;
        set({
          error: errorMessage,
        });
      }
    },

    // Delete single notification
    async deleteOne(notificationId: number) {
      try {
        await apiClient.delete(`/notifications/${notificationId}/clear`);
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.id !== notificationId
          ),
        }));
      } catch (error) {
        const errorMessage = "Failed to delete notification: " + error;
        set({
          error: errorMessage,
        });
      }
    },

    // Delete multiple notifications
    async deleteMany(notificationIds: number[]) {
      try {
        await apiClient.delete(`/notifications/clear`, {
          data: { notificationIds },
        });
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => !notificationIds.includes(n.id)
          ),
        }));
      } catch (error) {
        const errorMessage = "Failed to delete notifications: " + error;
        set({
          error: errorMessage,
        });
      }
    },

    clearError() {
      set({ error: null });
    },
  })
);
