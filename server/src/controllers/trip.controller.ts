import { Request, Response } from 'express';
import {
  createTrip,
  fetchSingleTrip,
  fetchTripsWithFilters,
  deleteTrip,
  deleteMultipleTrips,
  updateTrip,
} from '@/models/trip.model.js';
import { AuthenticatedRequest, TripFilters } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { getTripMember } from '@/models/member.model.js';
import { getTripExpensesGrouped } from '@/models/expense.model.js';
import { DateTime } from 'luxon';
import {
  notifyTripMembers,
  notifyTripMembersExceptInitiator,
} from '@/utils/notificationHandlers.js';
import { NotificationType } from '@/interfaces/enums.js';

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
    const startDate = DateTime.fromISO(start).toUTC().startOf('day');
    const endDate = DateTime.fromISO(end).toUTC().endOf('day');

    if (!startDate.isValid || !endDate.isValid) {
      res.status(400).json({ error: 'Invalid start or end date format' });
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

    // Fetch trip details
    const trip = await fetchSingleTrip(userId, tripId);

    // Fetch aggregated expense data
    const expenseSummary = await getTripExpensesGrouped(tripId);

    res
      .status(200)
      .json({ trip: { ...trip, expenseSummary: expenseSummary[tripId] } });
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

    const filters: TripFilters = {};
    const today = DateTime.now().startOf('day').toUTC().startOf('day');

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
            .toUTC()
            .startOf('day')
            .toJSDate(),
        };
      }
      if (endDate) {
        filters.endDate = {
          lte: DateTime.fromISO(endDate as string)
            .toUTC()
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

    // Get trip IDs and fetch aggregated expense data for all trips
    const tripIds = trips.map((t) => t.id);
    const expenseSummaries = await getTripExpensesGrouped(tripIds);

    // Map expense summaries to trips
    const tripData = trips.map((trip) => ({
      ...trip,
      expenseSummary: expenseSummaries[trip.id] || {
        breakdown: [],
        totalExpenses: 0,
      },
    }));

    res.status(200).json({ trips: tripData });
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

    // Notify trip members that the trip was deleted
    await notifyTripMembers(tripId, {
      type: NotificationType.TRIP_DELETED,
      relatedId: tripId,
      title: 'Trip Deleted',
      message: `The trip "${trip.name}" has been deleted.`,
      channel: 'IN_APP',
    });

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
      tripData.startDate = DateTime.fromISO(tripData.startDate)
        .toUTC()
        .startOf('day')
        .toJSDate();
    }
    if (tripData.endDate) {
      tripData.endDate = DateTime.fromISO(tripData.endDate)
        .toUTC()
        .endOf('day')
        .toJSDate();
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

    const updatedTrip = await updateTrip(tripId, tripData);

    // Notify all trip members about the update
    await notifyTripMembersExceptInitiator(tripId, userId, {
      type: NotificationType.TRIP_UPDATED,
      relatedId: tripId,
      title: 'Trip Updated',
      message: `The trip "${updatedTrip.name}" has been updated.`,
      channel: 'IN_APP',
    });

    res
      .status(200)
      .json({ message: 'Trip updated successfully', trip: updatedTrip });
  } catch (error) {
    handleControllerError(error, res, 'Error updating trip:');
  }
};
