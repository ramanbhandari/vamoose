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
}

export interface PollsProps {
  tripId: number;
  tripName: string;
}

export interface PollFilter {
  status: "all" | "active" | "expired";
  createdBy: string;
}
