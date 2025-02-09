import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/authInterface.ts";
import { CreateTripInput } from "../interfaces/tripInterface.ts";
import { createTrip } from "../models/tripModels.ts";

export const createTripHandler = async (req: AuthenticatedRequest<CreateTripInput>, res: Response): Promise<void> => {
  try {
    // This should be the right way to do it after the middleware has been configured
    //But for now i'll send the user id in the body
    // const { userId, body: { name, description, destination, startDate, endDate, budget } } = req; 

    //  TODO : Delete this after the middleware has been configured and use the above instead
    const { body: { name, description, destination, startDate: start, endDate: end, budget, userId } } = req;


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
      return
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
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
