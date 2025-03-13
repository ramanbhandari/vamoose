export type EventCategory =
  | "GENERAL"
  | "TRAVEL"
  | "ACTIVITY"
  | "MEAL"
  | "MEETING"
  | "FREE_TIME"
  | "OTHER";

export const eventCategories: EventCategory[] = [
  "GENERAL",
  "TRAVEL",
  "ACTIVITY",
  "MEAL",
  "MEETING",
  "FREE_TIME",
  "OTHER",
];

export interface CreateItineraryEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  category: EventCategory;
  assignedUserIds?: string[];
  notes?: CreateNote[];
}

export interface CreateNote {
  content: string;
}

export interface ItineraryEvent {
  id: number;
  tripId: number;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  category: EventCategory;
  createdById: string;
  createdAt: string;
  assignedUsers?: AssignedUser[];
  notes?: Note[];
}

export interface Note {
  id: number;
  eventId: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface AssignedUser {
  eventId: number;
  userId: string;
}
