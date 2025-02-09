import { CreateTripInput } from "../interfaces/tripInterface.ts";
import prisma from "../config/prismaClient.ts";
import { handlePrismaError } from "../utils/prismaErrorHandler.ts";

// Create a Trip
export const createTrip = async (tripData: CreateTripInput) => {
  try {
    return await prisma.trip.create({
      data: {
        ...tripData,
        members: {
          create: {
            userId: tripData.createdBy,
            role: "creator",
          },
        },
      },
      include: { members: true },
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    throw handlePrismaError(error);
  }
};

// Delete a Trip
export const deleteTrip = async (userId: number, tripId: number) => {
  try {
    return await prisma.trip.delete({
      where: {
        id: tripId,
        createdBy: userId,
      },
    });
  } catch (error) {
    console.error("Error deleting trip from DB:", error);
    throw handlePrismaError(error);
  }
};