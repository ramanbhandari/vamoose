import { Request, Response } from 'express';
import {
  createTrip,
  fetchTrip,
  fetchTripByDates,
  deleteTrip,
  deleteMultipleTrips,
  updateTrip,
} from '../models/tripModels.ts';
import { BaseError } from '../utils/errors';
import { AuthenticatedRequest } from '../interfaces/interfaces.ts';

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

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparison

    // Ensure valid dates
    if (isNaN(startDate.getDate()) || isNaN(endDate.getDate())) {
      res.status(400).json({ error: 'Invalid start date or end date format' });
      return;
    }

    // Ensure start date is today at the earliest or in the future
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
      startDate: startDate,
      endDate: endDate,
      budget: budget ?? null,
      createdBy: userId,
    });

    res.status(201).json({ message: 'Trip created successfully', trip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const fetchTripHandler = async (req: Request, res: Response) => {
  try{
    const userId = req.query.userId as string;
    const tripId = parseInt(req.params.tripId, 10);

    if (isNaN(tripId)){
      res.status(400).json({ error: 'Invalid trip ID'});
      return;
    }

    const trip = await fetchTrip(userId, tripId);

    if (!trip){
      res.status(404).json({ error: 'Trip not Found'});
      return;
    }

    if (!trip.members || !trip.members.some((member) => member.userId === userId) && trip.createdBy !== userId) {
      res.status(403).json({ error: 'You are not authorized to view this trip' });
      return;
    }

    res.status(200).json(trip);
    return;
    
  } catch(error){
    if (error instanceof BaseError){
      res.status(error.statusCode).json({ error: error.message});
    } else {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Internal Server Error'});
    }
  }
};

export const fetchTripByDatesHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Check the date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    if (startDate && (!isoDateRegex.test(startDate) || isNaN(Date.parse(startDate)))) {
      res.status(400).json({ error: 'Invalid dates' });
      return;
    }

    if (endDate && (!isoDateRegex.test(endDate) || isNaN(Date.parse(endDate)))) {
      res.status(400).json({ error: 'Invalid dates' });
      return;
    }

    // Fetch trips based on optional date filters.
    const trips = await fetchTripByDates(userId, startDate, endDate);

    if (!trips || trips.length === 0) {
      res.status(404).json({ error: 'Trip not Found' });
      return;
    }

    res.status(200).json(trips);
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error fetching trips by dates:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const deleteTripHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    const tripId = Number(req.params.tripId);
    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const deletedTrip = await deleteTrip(userId, tripId);

    res
      .status(200)
      .json({ message: 'Trip deleted successfully', trip: deletedTrip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

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
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

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

    const updatedTrip = await updateTrip(userId, tripId, tripData);

    res
      .status(200)
      .json({ message: 'Trip updated successfully', trip: updatedTrip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
