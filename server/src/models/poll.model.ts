import prisma from '@/config/prismaClient.js';
import { PollStatus } from '@/interfaces/enums.js';
import {
  CreatePollInput,
  DeletePollPermissions,
} from '@/interfaces/interfaces.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

export const createPoll = async ({
  tripId,
  question,
  expiresAt,
  createdById,
  options,
}: CreatePollInput) => {
  try {
    return await prisma.poll.create({
      data: {
        tripId,
        question,
        status: PollStatus.ACTIVE,
        expiresAt,
        createdById,
        options: {
          create: options.map((option) => ({ option })),
        },
      },
      include: {
        options: true,
      },
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    throw handlePrismaError(error);
  }
};

export const getPollById = async (pollId: number) => {
  try {
    return await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        createdBy: { select: { id: true, email: true } },
        trip: {
          include: {
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    throw handlePrismaError(error);
  }
};

export const deletePoll = async (pollId: number) => {
  try {
    return await prisma.poll.delete({
      where: {
        id: pollId,
      },
    });
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw handlePrismaError(error);
  }
};

export const deletePollsByIds = async (
  tripId: number,
  pollIds: number[],
  { isAdmin, isCreator, userId }: DeletePollPermissions,
) => {
  const whereClause = {
    tripId,
    id: { in: pollIds },
    ...(isAdmin || isCreator ? {} : { createdById: userId }), // Only delete owned polls if not an admin/creator
  };

  try {
    const result = await prisma.poll.deleteMany({
      where: whereClause,
    });

    return result.count;
  } catch (error) {
    console.error('Error deleting polls:', error);
    throw handlePrismaError(error);
  }
};
