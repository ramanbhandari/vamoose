import prisma from '@/configs/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { NotFoundError } from '@/utils/errors.js';
import { CreateMarkedLocationInput } from '@/interfaces/interfaces.js';

// Create a Marked Location
export const createMarkedLocation = async (
  locationData: CreateMarkedLocationInput,
) => {
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
export const getAllMarkedLocationsForTrip = async (tripId: number) => {
  try {
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
) => {
  try {
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
export const deleteMarkedLocation = async (locationId: string) => {
  try {
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
