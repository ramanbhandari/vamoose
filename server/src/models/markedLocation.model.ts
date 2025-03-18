import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { NotFoundError, ForbiddenError } from '@/utils/errors.js';
import { LocationType } from '@prisma/client';

// Create a Marked Location
export const createMarkedLocation = async (locationData: {
  tripId: number;
  name: string;
  type: LocationType;
  coordinates: { latitude: number; longitude: number };
  address?: string;
  createdById: string;
  notes?: string;
  website?: string;
  phoneNumber?: string;
}) => {
  try {
    return await prisma.markedLocation.create({
      data: locationData,
    });
  } catch (error) {
    console.error('Error creating marked location:', error);
    throw handlePrismaError(error);
  }
};

// Get all Marked Locations for a Trip
export const getAllMarkedLocationsForTrip = async (
  tripId: number,
  userId: string,
) => {
  try {
    // Check if user is a member of the trip
    const member = await prisma.tripMember.findFirst({
      where: {
        tripId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this trip');
    }

    return await prisma.markedLocation.findMany({
      where: {
        tripId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching marked locations:', error);
    throw handlePrismaError(error);
  }
};

// Get a single Marked Location by ID
export const getMarkedLocationById = async (
  tripId: number,
  locationId: string,
  userId: string,
) => {
  try {
    // Check if user is a member of the trip
    const member = await prisma.tripMember.findFirst({
      where: {
        tripId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this trip');
    }

    const location = await prisma.markedLocation.findUnique({
      where: {
        id: locationId,
        tripId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundError('Marked location not found');
    }

    return location;
  } catch (error) {
    console.error('Error fetching marked location:', error);
    throw handlePrismaError(error);
  }
};

// Update the notes field of a Marked Location
export const updateMarkedLocationNotes = async (
  locationId: string,
  notes: string,
) => {
  try {
    return await prisma.markedLocation.update({
      where: {
        id: locationId,
      },
      data: {
        notes,
      },
    });
  } catch (error) {
    console.error('Error updating marked location notes:', error);
    throw handlePrismaError(error);
  }
};

// Delete a Marked Location
export const deleteMarkedLocation = async (
  tripId: number,
  locationId: string,
  userId: string,
) => {
  try {
    // Check if the location exists and belongs to the specified trip
    const location = await prisma.markedLocation.findUnique({
      where: {
        id: locationId,
        tripId,
      },
    });

    if (!location) {
      throw new NotFoundError('Marked location not found');
    }

    // Check if user is a member of the trip
    const member = await prisma.tripMember.findFirst({
      where: {
        tripId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this trip');
    }

    return await prisma.markedLocation.delete({
      where: {
        id: locationId,
      },
    });
  } catch (error) {
    console.error('Error deleting marked location:', error);
    throw handlePrismaError(error);
  }
};
