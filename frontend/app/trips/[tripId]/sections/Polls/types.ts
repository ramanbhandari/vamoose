export interface PollOption {
  id: number;
  option: string;
  voteCount: number;
  percentage: number;
  voters: string[];
}

export interface PollCreator {
  id: string;
  email: string;
  fullName: string;
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
  winner: PollOption | null;
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
