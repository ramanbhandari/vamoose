export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt: string;
  tripId: number;
  createdBy: string;
  status: "active" | "expired";
  winner: PollOption;
}

export interface PollsProps {
  tripId: number;
  tripName: string;
}
