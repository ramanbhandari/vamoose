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

export interface TripFilters {
  destination?: { contains: string; mode: 'insensitive' };
  startDate?: { gte: Date } | { lte: Date };
  endDate?: { lte: Date } | { gte: Date };
}

export interface CreatePollInput {
  tripId: number;
  question: string;
  expiresAt: Date;
  createdById: string;
  options: string[];
}

export interface DeletePollPermissions {
  isAdmin: boolean;
  isCreator: boolean;
  userId: string;
}

export interface CastVoteInput {
  pollId: number;
  pollOptionId: number;
  userId: string;
}

export type DeleteVoteInput = Omit<CastVoteInput, 'pollOptionId'>;
