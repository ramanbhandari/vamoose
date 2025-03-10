import { Request, Response } from 'express';
import {
  createItineraryEvent,
  fetchSingleItineraryEvent,
  updateItineraryEvent,
} from '@/models/itineraryEvent.model.js';
import {
  getTripMember,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';
import { EventCategory } from '@/interfaces/enums.js';

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
    const event = await fetchSingleItineraryEvent(tripId, eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (
      event.createdById !== userId ||
      (requestingMember.role !== 'creator' && requestingMember.role !== 'admin')
    ) {
      res.status(403).json({
        error: 'Only the creator or an admin can update the event details.',
      });
      return;
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

    res.status(201).json({
      message: 'Itinerary event updated successfully',
      itineraryEvent,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error updating itinerary event:');
  }
};
