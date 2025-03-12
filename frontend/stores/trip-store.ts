import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";

export interface MemberDetails {
  email: string;
  fullName: string | null;
}

export interface Member {
  tripId: number;
  userId: string;
  role: string;
  user: MemberDetails;
}

export interface ExpenseBreakdown {
  category: string;
  total: number;
}

export interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

export interface PaidBy {
  fullName: string | null;
  email: string;
}

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: PaidBy;
}

export interface TripData {
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
  deleteExpense: (expenseIds: number | number[]) => void;
  deleteMember: (memberIds: string | string[]) => void;
  resetError: () => void;
}

const computeExpenseSummary = (expenses: Expense[]): ExpensesSummary => {
  const breakdown: { [category: string]: number } = {};
  let totalExpenses = 0;

  expenses.forEach((expense) => {
    totalExpenses += expense.amount;
    breakdown[expense.category] =
      (breakdown[expense.category] || 0) + expense.amount;
  });

  const breakdownArray = Object.entries(breakdown).map(([category, total]) => ({
    category,
    total,
  }));

  return { breakdown: breakdownArray, totalExpenses };
};

export const useTripStore = create<TripState>((set) => ({
  tripData: null,
  userTrips: [],
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

  deleteExpense: async (expenseIds: number | number[]) => {
    // Update the local state by filtering out the deleted expenses
    set((state) => {
      if (state.tripData) {
        let updatedExpenses = state.tripData.expenses;
        if (Array.isArray(expenseIds)) {
          updatedExpenses = updatedExpenses.filter(
            (expense) => !expenseIds.includes(expense.id)
          );
        } else {
          updatedExpenses = updatedExpenses.filter(
            (expense) => expense.id !== expenseIds
          );
        }
        // Recompute the expense summary based on updatedExpenses
        const updatedExpenseSummary = computeExpenseSummary(updatedExpenses);
        return {
          tripData: {
            ...state.tripData,
            expenses: updatedExpenses,
            expenseSummary: updatedExpenseSummary,
          },
        };
      }
      return {};
    });
  },

  deleteMember: async (memberIds: string | string[]) => {
    // Update the local state by filtering out the deleted members
    set((state) => {
      if (state.tripData) {
        let updatedMembers = state.tripData.members;
        if (Array.isArray(memberIds)) {
          updatedMembers = updatedMembers.filter(
            (member) => !memberIds.includes(member.userId)
          );
        } else {
          updatedMembers = updatedMembers.filter(
            (member) => member.userId !== memberIds
          );
        }

        return {
          tripData: {
            ...state.tripData,
            members: updatedMembers,
          },
        };
      }
      return {};
    });
  },

  resetError: () => set({ error: null }),
}));
