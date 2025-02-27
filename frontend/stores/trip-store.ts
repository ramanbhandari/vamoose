import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";

interface MemberDetails {
  email: string;
}

interface Member {
  tripId: number;
  userId: string;
  role: string;
  user: MemberDetails;
}

interface ExpenseBreakdown {
  category: string;
  total: number;
}

interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

interface PaidBy {
  email: string;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: PaidBy;
}

interface TripData {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Member[];
  expenses: Expense[];
  expenseSummary: ExpensesSummary;
  stays: Array<[]>;
  imageUrl: string;
}
interface TripState {
  tripData: TripData | null;
  loading: boolean;
  error: string | null;
  fetchTripData: (tripId: number) => Promise<void>;
  addExpense: (expense: Expense) => void;
  resetError: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  tripData: null,
  loading: false,
  error: null,

  fetchTripData: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${tripId}`);
      set({ tripData: response.data.trip, loading: false });
    } catch (error) {
      let errorMessage = "Failed to load trip data";

      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          errorMessage = "Trip not found :)";
        } else if (error.response?.status === 403) {
          errorMessage = "You do not have access to this trip :/";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, loading: false });
    }
  },

  addExpense: (expense) =>
    set((state) => ({
      tripData: state.tripData
        ? {
            ...state.tripData,
            expenses: [expense, ...state.tripData.expenses],
          }
        : null,
    })),

  resetError: () => set({ error: null }),
}));
