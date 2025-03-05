import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";

export interface ExpenseSummaryItem {
  expenseShareId: number;
  debtorId: string;
  creditorEmail: string;
  creditorId: string;
  amount: number;
  description: string;
  category: string;
  settled: boolean;
}

export interface MemberSummary {
  debtorEmail: string;
  outstanding: ExpenseSummaryItem[];
  settled: ExpenseSummaryItem[];
  totalOwed: number;
}

interface ExpenseShareState {
  memberSummaries: MemberSummary[];
  loading: boolean;
  error: string | null;
  fetchExpenseShareData: (tripId: number) => Promise<void>;
  resetError: () => void;
}

export const useExpenseShareStore = create<ExpenseShareState>((set) => ({
  memberSummaries: [],
  loading: false,
  error: null,

  fetchExpenseShareData: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${tripId}/expenseShares/debt-summary/`);
      set({ memberSummaries: response.data.summary, loading: false });
    } catch (error) {
      let errorMessage = "Failed to load expense share data";

      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          errorMessage = "Expense share data not found :)";
        } else if (error.response?.status === 403) {
          errorMessage = "You do not have access to this expense share data :/";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, loading: false });
    }
  },
  resetError: () => set({ error: null }),
}));