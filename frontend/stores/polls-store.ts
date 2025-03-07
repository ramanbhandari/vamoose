import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";
import { Poll } from "@/app/trips/[tripId]/sections/Polls/types";

interface PollState {
  polls: Poll[];
  activePolls: Poll[];
  completedPolls: Poll[];
  loading: boolean;
  error: string | null;
  fetchPolls: (tripId: number) => Promise<void>;
  resetError: () => void;
}

export const usePollStore = create<PollState>((set) => ({
  polls: [],
  activePolls: [],
  completedPolls: [],
  loading: false,
  error: null,

  fetchPolls: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${tripId}/polls/`);

      // split in ACTIVE and COMPLETED - TODO remove after API enables filter search
      const activePolls = response.data.polls.filter(
        (poll: Poll) => poll.status === "ACTIVE"
      );
      const completedPolls = response.data.polls.filter(
        (poll: Poll) => poll.status === "COMPLETED"
      );

      set({
        polls: response.data.polls,
        activePolls,
        completedPolls,
        loading: false,
      });
    } catch (error) {
      let errorMessage = "Failed to load Polls";

      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          errorMessage = "Polls not found :)";
        } else if (error.response?.status === 403) {
          errorMessage = "You do not have access to these Polls :/";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, loading: false });
    }
  },
  resetError: () => set({ error: null }),
}));
