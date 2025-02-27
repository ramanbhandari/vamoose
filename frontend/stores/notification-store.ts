import { create } from "zustand";

interface NotificationState {
  message: string | null;
  severity: "error" | "success" | "info" | "warning";
  setNotification: (
    message: string,
    severity: "error" | "success" | "info" | "warning"
  ) => void;
  clearNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  severity: "info",
  setNotification: (message, severity) => set({ message, severity }),
  clearNotification: () => set({ message: null, severity: "info" }),
}));
