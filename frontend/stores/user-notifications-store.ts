"use client";

import { create } from "zustand";
import apiClient from "@/utils/apiClient";

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
