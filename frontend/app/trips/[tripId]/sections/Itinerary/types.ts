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

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface AssignedUser {
  user: User;
}

export interface Note {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
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
  assignedUsers: AssignedUser[];
  notes: Note[];
  createdBy: User;
}

export interface ItineraryEventsResponse {
  itineraryEvents: ItineraryEvent[];
}
