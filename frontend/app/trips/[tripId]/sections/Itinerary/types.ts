export type EventCategory =
  | "GENERAL"
  | "TRAVEL"
  | "ACTIVITY"
  | "MEAL"
  | "MEETING"
  | "FREE_TIME"
  | "OTHER";

export interface CreateItineraryEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  category: EventCategory;
  assignedUserIds?: string[];
  notes?: CreateNote[];
}

export interface CreateNote {
  content: string;
}

export interface Event {
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
