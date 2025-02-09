import { CreateTripInput } from "../interfaces/tripInterface.ts";
import prisma from "../config/prismaClient.ts";

// Create a Trip
export const createTrip = async (tripData: CreateTripInput) =>
  prisma.trip.create({
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
  })
