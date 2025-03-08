export interface PollOption {
  id: number;
  option: string;
  voteCount: number;
  percentage: number;
  voters: Voter[];
}

export interface WinnerOption {
  id: number;
  option: string;
  voteCount: number;
}

export type PollWinner = WinnerOption | { options: WinnerOption[] };

export interface PollCreator {
  id: string;
  email: string;
  fullName: string;
}

export interface Voter {
  id: string;
  email: string;
  fullName: string | null;
}

export interface Poll {
  id: number;
  question: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  options: PollOption[];
  createdBy: PollCreator;
  totalVotes: number;
  winner: PollWinner | null;
}

export interface PollsProps {
  tripId: number;
  tripName: string;
}

// FORM & API
export interface CreatePollRequest {
  question: string;
  expiresAt: string;
  options: string[];
}
