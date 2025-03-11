import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

export const assignUsersToItineraryEvent = async (
  eventId: number,
  userIds: string[],
) => {
  try {
    return await prisma.itineraryEventAssignment.createMany({
      data: userIds.map((userId) => ({ eventId, userId })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('Error assigning users to event:', error);
    throw handlePrismaError(error);
  }
};

export const unassignUserFromItineraryEvent = async (
  eventId: number,
  userIds: string[],
) => {
  try {
    return await prisma.itineraryEventAssignment.deleteMany({
      where: {
        eventId,
        userId: { in: userIds },
      },
    });
  } catch (error) {
    console.error('Error unassigning users from event:', error);
    throw handlePrismaError(error);
  }
};

export const getAssignedUsersForEvent = async (eventId: number) => {
  try {
    return await prisma.itineraryEventAssignment.findMany({
      where: { eventId },
      select: {
        userId: true,
      },
    });
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    throw handlePrismaError(error);
  }
};
