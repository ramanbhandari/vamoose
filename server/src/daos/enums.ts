// PollStatus
export const PollStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TIE: 'TIE',
} as const;

export type PollStatus = (typeof PollStatus)[keyof typeof PollStatus];

// NotificationType
export const NotificationType = {
  POLL_CREATED: 'POLL_CREATED',
  POLL_COMPLETE: 'POLL_COMPLETED',
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
  EVENT_REMINDER: 'EVENT_REMINDER',
  EVENT_ASSIGNMENT: 'EVENT_ASSIGNMENT',
  EVENT_UNASSIGNMENT: 'EVENT_UNASSIGNMENT',
  EVENT_NOTE_ADDED: 'EVENT_NOTE_ADDED',
  EXPENSE_CREATED: 'EXPENSE_CREATED',
  EXPENSE_SHARE_ADDED: 'EXPENSE_SHARE_ADDED',
  EXPENSE_SHARE_SETTLED: 'EXPENSE_SHARE_SETTLED',
  LOCATION_MARKED: 'LOCATION_MARKED',
  LOCATION_NOTE_UPDATED: 'LOCATION_NOTE_UPDATED',
  INVITE_REJECTED: 'INVITE_REJECTED',
  MEMBER_JOINED: 'MEMBER_JOINED',
  MEMBER_LEFT: 'MEMBER_LEFT',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  MEMBERS_REMOVED: 'MEMBERS_REMOVED',
  MEMBER_ROLE_UPDATED: 'MEMBER_ROLE_UPDATED',
  TRIP_UPDATED: 'TRIP_UPDATED',
  TRIP_DELETED: 'TRIP_DELETED',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

// EventCategory
export const EventCategory = {
  GENERAL: 'GENERAL',
  TRAVEL: 'TRAVEL',
  ACTIVITY: 'ACTIVITY',
  MEAL: 'MEAL',
  MEETING: 'MEETING',
  FREE_TIME: 'FREE_TIME',
  OTHER: 'OTHER',
} as const;

export type EventCategory = (typeof EventCategory)[keyof typeof EventCategory];

// LocationType
export const LocationType = {
  ACCOMMODATION: 'ACCOMMODATION',
  RESTAURANT: 'RESTAURANT',
  CAFE: 'CAFE',
  SHOPPING: 'SHOPPING',
  GAS_STATION: 'GAS_STATION',
  OTHER: 'OTHER',
} as const;

export type LocationType = (typeof LocationType)[keyof typeof LocationType];
