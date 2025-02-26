import { Request, Response } from 'express';
import {
  createTrip,
  fetchSingleTrip,
  fetchTripsWithFilters,
  deleteTrip,
  deleteMultipleTrips,
  updateTrip,
} from '../models/trip.model.ts';
import { AuthenticatedRequest } from '../interfaces/interfaces.ts';
import { handleControllerError } from '../utils/errorHandlers.ts';
import { getTripMember } from '../models/member.model.ts';
import { DateTime } from 'luxon';

/**
 * Create a Trip
 */
export const createTripHandler = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      body: {
        name,
        description,
        destination,
        startDate: start,
        endDate: end,
        budget,
        imageUrl,
      },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!name || !destination || !start || !end) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Parse dates
    const startDate = DateTime.fromISO(start).startOf('day');
    const endDate = DateTime.fromISO(end).endOf('day');
    const today = DateTime.now().startOf('day');

    if (!startDate.isValid || !endDate.isValid) {
      res.status(400).json({ error: 'Invalid start or end date format' });
      return;
    }

    if (startDate < today) {
      res
        .status(400)
        .json({ error: 'Start date must be today or in the future' });
      return;
    }

    if (startDate >= endDate) {
      res.status(400).json({ error: 'Start date must be before end date' });
      return;
    }

    const trip = await createTrip({
      name,
      description,
      destination,
      startDate: startDate.toJSDate(),
      endDate: endDate.toJSDate(),
      budget: budget ?? null,
      createdBy: userId,
      imageUrl: imageUrl ?? null,
    });

    res.status(201).json({ message: 'Trip created successfully', trip });
    return;
  } catch (error) {
    handleControllerError(error, res, 'Error creating trip:');
  }
};

/**
 * Fetch a Single Trip
 */
export const fetchSingleTripHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const trip = await fetchSingleTrip(userId, tripId);
    res.status(200).json({ trip });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching trip:');
  }
};

/**
 * Fetch Trips with Filters
 */
export const fetchTripsWithFiltersHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const {
      destination,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      status, // current, future, past
    } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    const filters: any = {};
    const today = DateTime.now().startOf('day');

    // Handle destination filtering
    if (destination) {
      filters.destination = {
        contains: destination as string,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    // Handle status-based filtering
    if (status === 'past') {
      filters.endDate = { lte: today.toJSDate() }; // Ended before today
    } else if (status === 'future') {
      filters.startDate = { gte: today.plus({ days: 1 }).toJSDate() }; // Starts after today
    } else if (status === 'current') {
      filters.startDate = { lte: today.toJSDate() }; // Started on or before today
      filters.endDate = { gte: today.toJSDate() }; // Ends on or after today
    } else {
      // Apply manual startDate & endDate filters if provided
      if (startDate) {
        filters.startDate = {
          gte: DateTime.fromISO(startDate as string)
            .startOf('day')
            .toJSDate(),
        };
      }
      if (endDate) {
        filters.endDate = {
          lte: DateTime.fromISO(endDate as string)
            .endOf('day')
            .toJSDate(),
        };
      }
    }

    const trips = await fetchTripsWithFilters(
      userId,
      filters,
      Number(limit),
      Number(offset),
    );
    res.status(200).json({ trips });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching filtered trips:');
  }
};

/**
 * Delete a Single Trip (Only the Creator Can Delete)
 */
export const deleteTripHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Fetch the trip to verify ownership
    const trip = await fetchSingleTrip(userId, tripId);

    if (trip.createdBy !== userId) {
      res.status(403).json({ error: 'Only the creator can delete this trip' });
      return;
    }

    const deletedTrip = await deleteTrip(userId, tripId);
    res
      .status(200)
      .json({ message: 'Trip deleted successfully', trip: deletedTrip });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting trip:');
  }
};

/**
 * Delete Multiple Trips (Only the Creator Can Delete Their Trips)
 */
export const deleteMultipleTripsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      userId,
      body: { tripIds },
    } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      res.status(400).json({ error: 'Invalid trip ID list' });
      return;
    }

    const result = await deleteMultipleTrips(userId, tripIds);

    res.status(200).json({
      message: 'Trips deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting multiple trips:');
  }
};
/**
 * Update a Trip (Only the Creator and Admins Can Update)
 */
export const updateTripHandler = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      body: { ...tripData },
    } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    if (Object.keys(tripData).length === 0) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    if (tripData.startDate) {
      tripData.startDate = DateTime.fromISO(tripData.startDate).toJSDate();
    }
    if (tripData.endDate) {
      tripData.endDate = DateTime.fromISO(tripData.endDate).toJSDate();
    }

    // Fetch the trip to verify membership and role
    const trip = await fetchSingleTrip(userId, tripId);

    // Check if the requester is an admin or the creator
    const member = await getTripMember(tripId, userId);
    if (!member) {
      res.status(403).json({ error: 'You are not a member of this trip' });
      return;
    }

    if (trip.createdBy !== userId && member.role !== 'admin') {
      res
        .status(403)
        .json({ error: 'Only the creator or an admin can update this trip' });
      return;
    }

    const updatedTrip = await updateTrip(userId, tripId, tripData);
    res
      .status(200)
      .json({ message: 'Trip updated successfully', trip: updatedTrip });
  } catch (error) {
    handleControllerError(error, res, 'Error updating trip:');
  }
};
