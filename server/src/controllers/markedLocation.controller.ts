import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';
import { LocationType } from '@/interfaces/enums.js';
import {
  createMarkedLocation,
  getAllMarkedLocationsForTrip,
  updateMarkedLocationNotes,
  deleteMarkedLocation,
  getMarkedLocationById,
} from '@/models/markedLocation.model.js';
import { getTripMember } from '@/models/member.model.js';

// Create a new marked location
export const createMarkedLocationHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const { name, type, coordinates, address, notes, website, phoneNumber } =
      req.body;

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

    // Map type to LocationType enum
    const locationTypeEnum = Object.values(LocationType).includes(
      type?.toUpperCase(),
    )
      ? (type.toUpperCase() as LocationType)
      : LocationType.OTHER;

    // Create the marked location
    const markedLocation = await createMarkedLocation({
      tripId,
      name,
      type: locationTypeEnum,
      coordinates,
      address,
      createdById: userId,
      notes,
      website,
      phoneNumber,
    });

    res.status(201).json({
      message: 'Marked location created successfully',
      markedLocation,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error creating marked location:');
  }
};

// Get all marked locations for a trip
export const getAllMarkedLocationsHandler = async (
  req: Request,
  res: Response,
) => {
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

    // Check if the user is a member of the trip
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    const markedLocations = await getAllMarkedLocationsForTrip(tripId);

    res.status(200).json({
      message: 'Marked locations retrieved successfully',
      markedLocations,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error retrieving marked locations:');
  }
};

// Update the notes of a marked location
export const updateMarkedLocationNotesHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const locationId = req.params.locationId;
    const { notes } = req.body;

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

    // Check if the location exists and belongs to the specified trip
    const location = await getMarkedLocationById(tripId, locationId);
    if (!location) {
      res.status(404).json({ error: 'Marked location not found' });
      return;
    }

    // Update the notes
    const updatedLocation = await updateMarkedLocationNotes(locationId, notes);

    res.status(200).json({
      message: 'Marked location notes updated successfully',
      updatedLocation,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error updating marked location notes:');
  }
};

// Delete a marked location
export const deleteMarkedLocationHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const tripId = Number(req.params.tripId);
    const locationId = req.params.locationId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Check if the user is a member of the trip and get their role
    const requestingMember = await getTripMember(tripId, userId);
    if (!requestingMember) {
      res.status(403).json({
        error: `You are not a member of this trip: ${tripId}`,
      });
      return;
    }

    // Check if the location exists and belongs to the specified trip
    const location = await getMarkedLocationById(tripId, locationId);
    if (!location) {
      res.status(404).json({ error: 'Marked location not found' });
      return;
    }

    const isMarkerCreator = location.createdById === userId;
    const isTripAdminOrCreator =
      requestingMember.role === 'admin' || requestingMember.role === 'creator';

    if (!isMarkerCreator && !isTripAdminOrCreator) {
      res.status(403).json({
        error:
          'Only the marker creator, trip admins, and trip creators can delete marked locations',
      });
      return;
    }

    // Delete the location
    const deletedLocation = await deleteMarkedLocation(locationId);

    res.status(200).json({
      message: 'Marked location deleted successfully',
      deletedLocation,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting marked location:');
  }
};
