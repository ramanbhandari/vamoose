import { CreateTripInput, UpdateTripInput } from '../interfaces/interfaces.ts';
import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/prismaErrorHandler.ts';
import { NotFoundError, ForbiddenError } from '../utils/errors.ts';

// Create a Trip
export const createTrip = async (tripData: CreateTripInput) => {
  try {
    return await prisma.trip.create({
      data: {
        ...tripData,
        members: {
          create: {
            userId: tripData.createdBy,
            role: 'creator',
          },
        },
      },
      include: { members: true },
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    throw handlePrismaError(error);
  }
};

//Fetch (get) a trip
export const fetchTrip = async (userId: string, tripId: number, startDate?: string, endDate?: string) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        creator: true,
        members: { where: { userId }, select: { userId: true } },
      },
    });

    if (!trip) return null;

    // Check if the user is either the creator or a member
    if (trip.createdBy !== userId && trip.members.length === 0) {
      throw new ForbiddenError('You are not authorized to view this trip.');
    }

    return trip;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw handlePrismaError(error);
  }
};

//Fetch trips based on dates
export const fetchTripByDates = async (userId: string, startDate?: string, endDate?: string) => {
  try {
    const today = new Date();
    const conditions: any = {
      OR: [
        { createdBy: userId },
        { members: { some: { userId } } },
      ],
    };

    // Upcoming trips
    if (startDate && new Date(startDate) > today) {
      conditions.startDate = { gt: today };
    }
    // Past trips
    if (endDate && new Date(endDate) < today) {
      conditions.endDate = { lt: today };
    }

    if (startDate && endDate) {
      conditions.startDate = { gte: new Date(startDate) };
      conditions.endDate = { lte: new Date(endDate) };
    }

    const trips = await prisma.trip.findMany({
      where: conditions,
      include: {
        creator: true,
        members: { select: { userId: true } },
      },
    });

    return trips;
  } catch (error) {
    console.error('Error fetching trips by dates:', error);
    throw handlePrismaError(error);
  }
};



//Update a trip
export const updateTrip = async (
  userId: string,
  tripId: number,
  updateData: UpdateTripInput,
) => {
  try {
    return await prisma.trip.update({
      where: {
        id: tripId,
        createdBy: userId, // Ensure only the creator can update
      },
      data: {
        ...updateData,
      },
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    throw handlePrismaError(error);
  }
};

// Delete a Trip
export const deleteTrip = async (userId: string, tripId: number) => {
  try {
    return await prisma.trip.delete({
      where: {
        id: tripId,
        createdBy: userId,
      },
    });
  } catch (error) {
    console.error('Error deleting trip from DB:', error);
    throw handlePrismaError(error);
  }
};

//delete multiple trips
export const deleteMultipleTrips = async (
  userId: string,
  tripIds: number[],
) => {
  try {
    const result = await prisma.trip.deleteMany({
      where: {
        id: {
          in: tripIds,
        },
        createdBy: userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError(
        'No trips deleted. Either they do not exist or you are not authorized.',
      );
    }

    return {
      message: 'Trips deleted successfully',
      deletedCount: result.count,
    };
  } catch (error) {
    console.error('Error deleting trip from DB:', error);
    throw handlePrismaError(error);
  }
};
