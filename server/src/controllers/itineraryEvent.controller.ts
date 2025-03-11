import { Request, Response } from 'express';
import { createItineraryEvent } from '@/models/itineraryEvent.model.js';
import {
  getTripMember,
  getManyTripMembersFilteredByUserId,
} from '@/models/member.model.js';
import { fetchSingleTrip } from '@/models/trip.model.js';
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

    // Fetch trip details
    const tripDetails = await fetchSingleTrip(userId, tripId);
    const { startDate, endDate } = tripDetails;

    const tripStartDate = DateTime.fromJSDate(startDate);
    const tripEndDate = DateTime.fromJSDate(endDate);

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

    res.status(201).json({
      message: 'Itinerary event created successfully',
      itineraryEvent,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error creating itinerary event:');
  }
};
