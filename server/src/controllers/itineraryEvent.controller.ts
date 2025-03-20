import { Request, Response } from 'express';
import {
  createItineraryEvent,
  updateItineraryEvent,
  getAllItineraryEventsForTrip,
  getItineraryEventById,
  deleteItineraryEvent,
  deleteItineraryEventsByIds,
} from '@/models/itineraryEvent.model.js';
import {
  getTripMember,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { fetchSingleTrip } from '@/models/trip.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';
import { EventCategory } from '@/interfaces/enums.js';
import {
  cancelScheduledNotifications,
  notifySpecificTripMembers,
  notifyTripMembers,
  notifyTripMembersExceptInitiator,
} from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/interfaces/enums.js';

export const createItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      category,
      assignedUserIds,
      notes,
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Fetch trip details
    const tripDetails = await fetchSingleTrip(userId, tripId);
    const { startDate, endDate } = tripDetails;

    const tripStartDate = DateTime.fromJSDate(startDate).toUTC();
    const tripEndDate = DateTime.fromJSDate(endDate).toUTC();

    // Ensure event's dates are within trip's dates
    if (startTime) {
      const startTimeUtc = DateTime.fromISO(startTime).toUTC();
      if (startTimeUtc < tripStartDate || startTimeUtc > tripEndDate) {
        res.status(400).json({
          error: `Start time must be within the trip's duration: ${tripStartDate.toISO()} to ${tripEndDate.toISO()}`,
        });
        return;
      }
    }

    if (endTime) {
      const endTimeUtc = DateTime.fromISO(endTime).toUTC();
      if (endTimeUtc < tripStartDate || endTimeUtc > tripEndDate) {
        res.status(400).json({
          error: `End time must be within the trip's duration: ${tripStartDate.toISO()} to ${tripEndDate.toISO()}`,
        });
        return;
      }
    }

    // Check if all assigned users are members of the trip
    if (assignedUserIds && assignedUserIds.length > 0) {
      const tripMembers = await getManyTripMembersFilteredByUserId(
        tripId,
        assignedUserIds,
      );

      const validUserIds = new Set(tripMembers.map((member) => member.userId));
      const invalidUserIds = assignedUserIds.filter(
        (id: string) => !validUserIds.has(id),
      );

      if (invalidUserIds.length > 0) {
        res.status(400).json({
          error: `The following users are not members of this trip: ${invalidUserIds.join(', ')}`,
        });
        return;
      }
    }

    // Convert times to UTC if provided
    const startTimeUtc = startTime
      ? DateTime.fromISO(startTime).toUTC().toJSDate()
      : undefined;
    const endTimeUtc = endTime
      ? DateTime.fromISO(endTime).toUTC().toJSDate()
      : undefined;

    // Map category to EventCategory enum
    const categoryEnum = Object.values(EventCategory).includes(
      category?.toUpperCase(),
    )
      ? (category.toUpperCase() as EventCategory)
      : EventCategory.GENERAL;

    // Create the itinerary event
    const itineraryEvent = await createItineraryEvent({
      tripId,
      title,
      description,
      location,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      category: categoryEnum,
      createdById: userId,
      assignedUserIds: assignedUserIds ?? [],
      notes: notes ?? [],
    });

    // Notify the trip members of the new event and schedule reminders
    const trip = await fetchSingleTrip(userId, tripId);
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.EVENT_CREATED,
      relatedId: itineraryEvent.id,
      title: `New Itinerary Event Added for trip "${trip.name}"!`,
      message: `"${title}” has been added to the trip itinerary. Check the schedule for details!`,
      channel: 'IN_APP',
    });

    if (startTimeUtc) {
      const now = DateTime.now().toUTC();
      const eventStart = DateTime.fromJSDate(startTimeUtc);
      //Schedule a notification for 1 hour from the event start time
      if (eventStart.diff(now, 'hours').hours >= 1) {
        await notifyTripMembers(tripId, {
          type: NotificationType.EVENT_REMINDER,
          relatedId: itineraryEvent.id,
          title: `Upcoming Itinerary Event for trip "${trip.name}"!`,
          message: `"${title}" starts in an hour. Don't miss it!`,
          channel: 'IN_APP',
          sendAt: eventStart.minus({ hours: 1 }).toJSDate(),
        });
      }

      //Schedule a notification for 30 minutes from the event start time
      if (eventStart.diff(now, 'minutes').minutes >= 30) {
        await notifyTripMembers(tripId, {
          type: NotificationType.EVENT_REMINDER,
          relatedId: itineraryEvent.id,
          title: `Upcoming Itinerary Event for trip "${trip.name}"!`,
          message: `"${title}" starts in 30 minutes. Don't miss it!`,
          channel: 'IN_APP',
          sendAt: eventStart.minus({ minutes: 30 }).toJSDate(),
        });
      }

      // Notify the assigned users
      if (assignedUserIds && assignedUserIds.length > 0) {
        const assignedUsersToNotify = assignedUserIds.filter(
          (id: string) => id !== userId,
        );
        await notifySpecificTripMembers(tripId, assignedUsersToNotify, {
          type: NotificationType.EVENT_ASSIGNMENT,
          relatedId: itineraryEvent.id,
          title: "You're now assigned to an event!",
          message: `You have been assigned as a planner for event "${itineraryEvent.title}" in trip "${trip.name}".`,
          channel: 'IN_APP',
        });
      }
    }

    res.status(201).json({
      message: 'Itinerary event created successfully',
      itineraryEvent,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error creating itinerary event:');
  }
};

export const updateItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);
    const { title, description, location, startTime, endTime, category } =
      req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    //check if the event exists
    const event = await getItineraryEventById(tripId, eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (
      event.createdById !== userId &&
      requestingMember.role !== 'creator' &&
      requestingMember.role !== 'admin'
    ) {
      res.status(403).json({
        error:
          'Only the trip creator, event creator or an admin can update the event details.',
      });
      return;
    }

    // Fetch trip details
    const tripDetails = await fetchSingleTrip(userId, tripId);
    const { startDate, endDate } = tripDetails;

    const tripStartDate = DateTime.fromJSDate(startDate).toUTC();
    const tripEndDate = DateTime.fromJSDate(endDate).toUTC();

    // Ensure event's dates are within trip's dates
    if (startTime) {
      const startTimeUtc = DateTime.fromISO(startTime).toUTC();
      if (startTimeUtc < tripStartDate || startTimeUtc > tripEndDate) {
        res.status(400).json({
          error: `Start time must be within the trip's duration: ${tripStartDate.toISO()} to ${tripEndDate.toISO()}`,
        });
        return;
      }
    }

    if (endTime) {
      const endTimeUtc = DateTime.fromISO(endTime).toUTC();
      if (endTimeUtc < tripStartDate || endTimeUtc > tripEndDate) {
        res.status(400).json({
          error: `End time must be within the trip's duration: ${tripStartDate.toISO()} to ${tripEndDate.toISO()}`,
        });
        return;
      }
    }

    // Convert times to UTC if provided
    const startTimeUtc = startTime
      ? DateTime.fromISO(startTime).toUTC().toJSDate()
      : undefined;
    const endTimeUtc = endTime
      ? DateTime.fromISO(endTime).toUTC().toJSDate()
      : undefined;

    // Map category to EventCategory enum
    const categoryEnum = Object.values(EventCategory).includes(
      category?.toUpperCase(),
    )
      ? (category.toUpperCase() as EventCategory)
      : EventCategory.GENERAL;

    // Update the itinerary event
    const itineraryEvent = await updateItineraryEvent(eventId, {
      title,
      description,
      location,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      category: categoryEnum,
    });

    // Notify trip members (except initiator) about the update
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.EVENT_UPDATED,
      relatedId: itineraryEvent.id,
      title: `An Itinerary Event has been updated in trip "${tripDetails.name}"!`,
      message: `The event "${title}" has been modified. Check the itinerary for details.`,
      channel: 'IN_APP',
    });

    // Check if the start time changed
    if (
      startTimeUtc &&
      (!event.startTime || startTimeUtc.getTime() !== event.startTime.getTime())
    ) {
      // Remove old scheduled notifications
      await cancelScheduledNotifications(
        itineraryEvent.id,
        NotificationType.EVENT_REMINDER,
      );

      const now = DateTime.now().toUTC();
      const eventStart = DateTime.fromJSDate(startTimeUtc);

      // Schedule new reminders
      if (eventStart.diff(now, 'hours').hours >= 1) {
        await notifyTripMembers(tripId, {
          type: NotificationType.EVENT_REMINDER,
          relatedId: itineraryEvent.id,
          title: `Upcoming Itinerary Event for trip "${tripDetails.name}"!`,
          message: `"${title}" starts in an hour. Don't miss it!`,
          channel: 'IN_APP',
          sendAt: eventStart.minus({ hours: 1 }).toJSDate(),
        });
      }

      if (eventStart.diff(now, 'minutes').minutes >= 30) {
        await notifyTripMembers(tripId, {
          type: NotificationType.EVENT_REMINDER,
          relatedId: itineraryEvent.id,
          title: `Upcoming Itinerary Event for trip "${tripDetails.name}"!`,
          message: `"${title}" starts in 30 minutes. Don't miss it!`,
          channel: 'IN_APP',
          sendAt: eventStart.minus({ minutes: 30 }).toJSDate(),
        });
      }
    }

    res.status(201).json({
      message: 'Itinerary event updated successfully',
      itineraryEvent,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error updating itinerary event:');
  }
};

export const getAllItineraryEventsForTripHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { category, startTime, endTime } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Check if the user is a member of the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Convert filters to appropriate formats
    const categoryFilter = category
      ? ((category as string).toUpperCase() as EventCategory)
      : undefined;
    const startTimeFilter = startTime
      ? DateTime.fromISO(startTime as string)
          .toUTC()
          .toJSDate()
      : undefined;
    const endTimeFilter = endTime
      ? DateTime.fromISO(endTime as string)
          .toUTC()
          .toJSDate()
      : undefined;

    // Fetch itinerary events
    const itineraryEvents = await getAllItineraryEventsForTrip(tripId, {
      category: categoryFilter,
      startTime: startTimeFilter,
      endTime: endTimeFilter,
    });

    res.status(200).json({ itineraryEvents });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching itinerary events:');
  }
};

export const getItineraryEventByIdHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    // Check if the user is a member of the trip
    const isMember = await getTripMember(tripId, userId);
    if (!isMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Fetch the itinerary event
    const itineraryEvent = await getItineraryEventById(tripId, eventId);

    if (!itineraryEvent) {
      res.status(404).json({ error: 'Itinerary event not found' });
      return;
    }

    res.status(200).json({ itineraryEvent });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching itinerary event:');
  }
};

export const deleteItineraryEventHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const eventId = Number(req.params.eventId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (isNaN(eventId)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Check for permissions (creator, admin, or event creator)
    const isAdmin = requestingMember.role === 'admin';
    const isTripCreator = requestingMember.role === 'creator';

    // Fetch the itinerary event
    const itineraryEvent = await getItineraryEventById(tripId, eventId);
    if (!itineraryEvent) {
      res.status(404).json({ error: 'Itinerary event not found' });
      return;
    }

    const isEventCreator = itineraryEvent.createdById === userId;

    if (!isAdmin && !isTripCreator && !isEventCreator) {
      res.status(403).json({
        error:
          'Only an admin, the trip creator, or the event creator can delete this event',
      });
      return;
    }

    // Delete the itinerary event
    await deleteItineraryEvent(tripId, eventId);

    // Notify the assigned users that the trip event they were assigned to plan was deleted
    const assignedUsersToNotify = itineraryEvent.assignedUsers
      .map((assignedUser) => assignedUser.user.id)
      .filter((id: string) => id !== userId);

    await notifySpecificTripMembers(tripId, assignedUsersToNotify, {
      type: NotificationType.EVENT_DELETED,
      relatedId: itineraryEvent.id,
      title: 'An event you were assigned to has been deleted!',
      message: `The event '${itineraryEvent.title}' has been removed from the itinerary.`,
      channel: 'IN_APP',
    });

    res.status(200).json({ message: 'Itinerary event deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting itinerary event:');
  }
};

export const batchDeleteItineraryEventsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { eventIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      res.status(400).json({ error: 'Invalid event IDs' });
      return;
    }

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    const isAdmin = requestingMember.role === 'admin';
    const isTripCreator = requestingMember.role === 'creator';

    // Fetch the itinerary events to check permissions
    const events = await getAllItineraryEventsForTrip(tripId, {});

    if (!events || !events.length) {
      res.status(404).json({
        error: 'No valid itinerary events found for deletion in this trip',
      });
      return;
    }
    // Filter out events the user is not allowed to delete
    const allowedEventIds = events
      .filter(
        (event) =>
          eventIds.includes(event.id) &&
          (isAdmin || isTripCreator || event.createdById === userId),
      )
      .map((event) => event.id);

    if (allowedEventIds.length === 0) {
      res.status(403).json({
        error: 'You are not authorized to delete any of these events',
      });
      return;
    }

    const deletedCount = await deleteItineraryEventsByIds(
      tripId,
      allowedEventIds,
    );

    res.status(200).json({
      message: 'Itinerary events deleted successfully',
      deletedCount: deletedCount.count,
      eventsDeletedIds: allowedEventIds,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting itinerary events:');
  }
};
