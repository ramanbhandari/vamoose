import { Request, Response } from 'express';
import { createItineraryEvent } from '@/models/itineraryEvent.model';
import { getTripMember } from '@/models/member.model';
import { AuthenticatedRequest } from '@/interfaces/interfaces';
import { handleControllerError } from '@/utils/errorHandlers';
import { DateTime } from 'luxon';
import { EventCategory } from '@/interfaces/enums';

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
      return res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
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
