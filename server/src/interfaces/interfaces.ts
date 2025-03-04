import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

// Trip Interfaces
export interface CreateTripInput {
  name: string;
  description?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  imageUrl?: string | null;
  createdBy: string;
}

export type UpdateTripInput = Partial<Omit<CreateTripInput, 'createdBy'>>;

// Invitation Interfaces
export interface CreateInviteInput {
  tripId: number;
  email: string;
  createdBy: string;
  invitedUserId?: string;
}

// Member Interfaces
export interface UpdateTripMemberInput {
  role?: 'admin' | 'member';
}

export interface TripDebtDetail {
  expenseShareId: number;
  debtorId: string;
  creditorEmail: string;
  creditorId: string;
  amount: number;
  description?: string | null;
  category?: string;
  settled: boolean;
}

// Expenses Interface
export interface CreateExpenseInput {
  tripId: number;
  amount: number;
  category: string;
  description?: string | null;
  paidById?: string
  splitAmongUserIds: string[];
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;