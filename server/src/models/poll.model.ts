import prisma from '@/configs/prismaClient.js';
import { PollStatus } from '@/daos/enums.js';
import { CreatePollInput, DeletePollPermissions } from '@/daos/interfaces.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';

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
        options: {
          select: {
            id: true,
            option: true,
            votes: true,
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

export const getAllPollsForTrip = async (tripId: number) => {
  try {
    return await prisma.poll.findMany({
      where: { tripId },
      include: {
        options: {
          select: {
            id: true,
            option: true,
            votes: {
              select: {
                user: {
                  select: { id: true, email: true, fullName: true },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, email: true, fullName: true },
        },
        winner: {
          select: { id: true, option: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw handlePrismaError(error);
  }
};

export const markPollAsCompleted = async (
  pollId: number,
  status: 'COMPLETED' | 'TIE',
  winnerId: number | null,
) => {
  try {
    return await prisma.poll.update({
      where: { id: pollId },
      data: {
        status,
        completedAt: DateTime.now().toUTC().toJSDate(),
        winnerId,
      },
    });
  } catch (error) {
    console.error('Error marking poll as completed:', error);
    throw handlePrismaError(error);
  }
};
