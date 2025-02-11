import { Request, Response } from "express";
import { AuthenticatedRequest } from "../interfaces/authInterface.ts";
import { createTrip, deleteTrip, deleteMultipleTrips, updateTrip } from "../models/tripModels.ts";
import { BaseError } from "../utils/errors";

export const createTripHandler = async (req: Request, res: Response) => {
  try {
    // This should be the right way to do it after the middleware has been configured
    //But for now i'll send the user id in the body
    // const { userId, body: { name, description, destination, startDate, endDate, budget } } = req as AuthenticatedRequest; 

    //  TODO : Delete this after the middleware has been configured and use the above instead
    const { body: { name, description, destination, startDate: start, endDate: end, budget, userId } } = req as AuthenticatedRequest;


    if (!userId) {
      res.status(401).json({ error: "Unauthorized Request" });
      return;
    }

    if (!name || !destination || !start || !end) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparison

    // Ensure valid dates
    if (isNaN(startDate.getDate()) || isNaN(endDate.getDate())) {
      res.status(400).json({ error: "Invalid start date or end date format" });
      return;
    }

    // Ensure start date is today at the earliest or in the future
    if (startDate < today) {
      res.status(400).json({ error: "Start date must be today or in the future" });
      return;
    }

    if (startDate >= endDate) {
      res.status(400).json({ error: "Start date must be before end date" });
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

    res.status(201).json({ message: "Trip created successfully", trip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const deleteTripHandler = async (req: Request, res: Response) => {
  try {
    // This should be the right way to do it after the middleware has been configured
    //But for now i'll send the user id in the body
    // const { userId } = req as AuthenticatedRequest;;

    //  TODO : Delete this after the middleware has been configured and use the above instead
    const { body: { userId } } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized Request" });
      return;
    }

    const tripId = Number(req.params.tripId);
    if (isNaN(tripId)) {
      res.status(400).json({ error: "Invalid trip ID" });
      return;
    }

    const deletedTrip = await deleteTrip(userId, tripId);

    res.status(200).json({ message: "Trip deleted successfully", trip: deletedTrip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const deleteMultipleTripsHandler = async (req: Request, res: Response) => {
  try {
    // This should be the right way to do it after the middleware has been configured
    //But for now i'll send the user id in the body
    // const { userId, body: { tripIds } } = req as AuthenticatedRequest;;

    // TODO: Replace this after middleware is configured
    const { body: { userId, tripIds } } = req as AuthenticatedRequest;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized Request" });
      return;
    }

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      res.status(400).json({ error: "Invalid trip ID list" });
      return;
    }

    const result = await deleteMultipleTrips(userId, tripIds);

    res.status(200).json({ message: "Trips deleted successfully", deletedCount: result.deletedCount });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const updateTripHandler = async (req: Request, res: Response) => {
  try {
    // This should be the right way to do it after the middleware has been configured
    //But for now i'll send the user id in the body
    // const { userId, body: {createdBy:_, ...tripData } } = req as AuthenticatedRequest;

    // TODO: Replace this after middleware is configured
    const { body: { userId, createdBy: _, ...tripData } } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized Request" });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: "Invalid trip ID" });
      return;
    }

    if (Object.keys(tripData).length === 0) {
      res.status(400).json({ error: "No fields provided for update" });
      return;
    }

    const updatedTrip = await updateTrip(userId, tripId, tripData);

    res.status(200).json({ message: "Trip updated successfully", trip: updatedTrip });
    return;
  } catch (error) {
    if (error instanceof BaseError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
