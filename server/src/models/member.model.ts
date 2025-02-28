import { PrismaPromise } from '@prisma/client';
import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { UpdateTripMemberInput } from '@/interfaces/interfaces.js';

// Get tripMember by tripId and userId
export const getTripMember = async (tripId: number, userId: string) => {
  try {
    return await prisma.tripMember.findUnique({
      where: {
        tripId_userId: { tripId, userId },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting the existing trip member:', error);
    throw handlePrismaError(error);
  }
};

// Get multiple trip members by tripId
export const getAllTripMembers = async (tripId: number) => {
  try {
    return await prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trip members:', error);
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
      include: {
        user: {
          select: {
            email: true,
          },
        },
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
    include: {
      user: {
        select: {
          email: true,
        },
      },
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
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error updating trip member:', error);
    throw handlePrismaError(error);
  }
};

/**
 * Removes a member from a trip (except the creator)
 */
export const deleteTripMember = async (tripId: number, userId: string) => {
  try {
    return await prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId } },
    });
  } catch (error) {
    console.error('Error removing trip member:', error);
    throw handlePrismaError(error);
  }
};

/**
 * Get the count of members in a trip
 */
export const getTripMemberCount = async (tripId: number) => {
  try {
    return await prisma.tripMember.count({
      where: { tripId },
    });
  } catch (error) {
    console.error('Error fetching trip member count:', error);
    throw handlePrismaError(error);
  }
};

// Delete multiple members from a trip
export const deleteManyTripMembers = async (
  tripId: number,
  userIds: string[],
) => {
  try {
    return await prisma.tripMember.deleteMany({
      where: { tripId, userId: { in: userIds } },
    });
  } catch (error) {
    console.error('Error deleting trip members:', error);
    throw handlePrismaError(error);
  }
};
