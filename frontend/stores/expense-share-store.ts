import apiClient from "@/utils/apiClient";
import { create } from "zustand";
import { AxiosError } from "axios";
import { useNotificationStore } from "./notification-store";

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
  settleExpenses: (
    tripId: number,
    debtorEmail: string,
    expensesToSettle: { expenseId: number, debtorUserId: string }[]
  ) => Promise<void>;
  resetError: () => void;
}

export const useExpenseShareStore = create<ExpenseShareState>((set, get) => ({
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

  settleExpenses: async (tripId, debtorEmail, expensesToSettle) => {
    set({ loading: true, error: null });
    try {
      // Call the API to settle expenses
      const response = await apiClient.patch(`/trips/${tripId}/expenseShares/settle/`, {
        expensesToSettle: expensesToSettle.map((expense) => ({
          expenseId: expense.expenseId,
          debtorUserId: expense.debtorUserId, 
        })),
      });

      const { settledExpenses, nonExistentExpensePairs, unauthorizedExpensePairs, poorlyFormattedExpenses } = response.data;

      // Notify the user about the results
      const { setNotification } = useNotificationStore.getState();
      if (settledExpenses.length > 0) {
        setNotification(`${settledExpenses.length} expenses settled successfully!`, "success");
      }
      if (nonExistentExpensePairs.length > 0) {
        setNotification(`${nonExistentExpensePairs.length} expenses could not be found.`, "warning");
      }
      if (unauthorizedExpensePairs.length > 0) {
        setNotification(`You are not authorized to settle ${unauthorizedExpensePairs.length} expenses.`, "warning");
      }
      if (poorlyFormattedExpenses.length > 0) {
        setNotification(`${poorlyFormattedExpenses.length} expenses were poorly formatted.`, "warning");
      }

      // Update the local state with successfully settled expenses
      const { memberSummaries } = get();
      const updatedMemberSummaries = memberSummaries.map((memberSummary) => {
        if (memberSummary.debtorEmail === debtorEmail) {
          // Find the expenses that were successfully settled
          const settledExpenseIds = settledExpenses.map((e:{ expenseId: number, debtorUserId: string }) => e.expenseId);
          const settledExpensesForMember = memberSummary.outstanding.filter((expense) =>
            settledExpenseIds.includes(expense.expenseShareId)
          );

          if (settledExpensesForMember.length > 0) {
            // Move settled expenses from outstanding to settled
            return {
              ...memberSummary,
              outstanding: memberSummary.outstanding.filter(
                (expense) => !settledExpenseIds.includes(expense.expenseShareId)
              ),
              settled: [...memberSummary.settled, ...settledExpensesForMember],
              totalOwed: memberSummary.totalOwed - settledExpensesForMember.reduce((sum, expense) => sum + expense.amount, 0),
            };
          }
        }
        return memberSummary;
      });

      set({ memberSummaries: updatedMemberSummaries, loading: false });
    } catch (error) {
      let errorMessage = "Failed to settle expenses";

      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          errorMessage = "Expense data not found :)";
        } else if (error.response?.status === 403) {
          errorMessage = "You do not have access to this expense data :/";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ loading: false });
      useNotificationStore.getState().setNotification(errorMessage, "error");
    }
  },

  resetError: () => set({ error: null }),
}));