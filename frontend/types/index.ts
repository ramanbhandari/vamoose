export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  tripId: number;
  paidBy: PaidBy;
}

export interface PaidBy {
  email: string;
}

export interface MemberDetails {
  email: string;
}

export interface Member {
  tripId: number;
  userId: string;
  role: string;
  user: MemberDetails;
}

export interface TripData {
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

export interface CitySuggestion {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface ExpenseBreakdown {
  category: string;
  total: number;
}

export interface ExpensesSummary {
  breakdown: ExpenseBreakdown[];
  totalExpenses: number;
}

// Photo API Response
export interface PhotonAPIResponse {
  features: {
    properties: {
      name: string;
      country: string;
    };
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }[];
}

export interface Poll {
  id: string;
  question: string;
  votes: number;
}
