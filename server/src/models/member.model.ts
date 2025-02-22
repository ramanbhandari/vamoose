import { PrismaPromise } from '@prisma/client';
import prisma from '../config/prismaClient.ts';
import { handlePrismaError } from '../utils/errorHandlers.ts';
import { UpdateTripMemberInput } from '../interfaces/interfaces.ts';

// Get tripMember by tripId and userId
export const getTripMember = async (tripId: number, userId: string) => {
  try {
    return await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
  } catch (error) {
    console.error('Error getting the existing trip member:', error);
    throw handlePrismaError(error);
  }
};

// Get multiple trip members by tripId
export const getManyTripMembers = async (tripId: number) => {
  try {
    return await prisma.tripMember.findMany({
      where: { tripId },
    });
  } catch (error) {
    console.error('Error getting trip members:', error);
    throw handlePrismaError(error);
  }
};

// Get multiple trip members by tripId, filtered to a subset of userIds
export const getManyTripMembersFilteredByUserId = async (
  tripId: number,
  userIds: string[],
) => {
  try {
    return await prisma.tripMember.findMany({
      where: {
        tripId,
        userId: { in: userIds }, // Only return trip members that match the provided userIds
      },
    });
  } catch (error) {
    console.error('Error getting filtered trip members:', error);
    throw handlePrismaError(error);
  }
};

// Add trip member
// Needs the PrismaPromise for Prisma transactions
export const addTripMember = (
  tripId: number,
  userId: string,
  role: string,
  inTransaction: boolean = false,
): PrismaPromise<any> => {
  const createOperation = prisma.tripMember.create({
    data: {
      tripId,
      userId,
      role,
    },
  });

  if (inTransaction) {
    return createOperation;
  } else {
    return createOperation.catch((error) => {
      console.error('Error adding trip member:', error);
      throw handlePrismaError(error);
    }) as PrismaPromise<any>;
  }
};

export const updateTripMember = async (
  tripId: number,
  userId: string,
  updateData: UpdateTripMemberInput,
) => {
  try {
    return await prisma.tripMember.update({
      where: { tripId_userId: { tripId, userId } },
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating trip member:', error);
    throw handlePrismaError(error);
  }
};
