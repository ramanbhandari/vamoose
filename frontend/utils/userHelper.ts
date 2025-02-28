import { User } from "@supabase/supabase-js";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: {
    email: string;
  };
}

interface Member {
  tripId: number;
  userId: string;
  role: string;
  user: {
    email: string;
  };
}

interface ExpenseBreakdown {
  category: string;
  total: number;
}

interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

interface TripData {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: Member[];
  expenses: Expense[];
  stays: Array<[]>;
  imageUrl: string;
  description: string;
  expenseSummary: ExpensesSummary;
}

interface UserInfo {
  id: string;
  email?: string;
  isCreator: (tripData: TripData | null) => boolean;
  isMember: (tripData: TripData | null) => boolean;
  getRole: (tripData: TripData | null) => string | undefined;
}

export function getUserInfo(user: User | null): UserInfo | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,

    isCreator: (tripData: TripData | null) => {
      return (
        tripData?.members.some(
          (member) => member.userId === user.id && member.role === "creator"
        ) ?? false
      );
    },

    isMember: (tripData: TripData | null) => {
      return (
        tripData?.members.some((member) => member.userId === user.id) ?? false
      );
    },

    getRole: (tripData: TripData | null) => {
      return tripData?.members.find((member) => member.userId === user.id)
        ?.role;
    },
  };
}
