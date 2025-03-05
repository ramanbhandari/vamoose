import prisma from '@/config/prismaClient.js';
import { PollStatus } from '@/interfaces/enums.js';
import { CreatePollInput } from '@/interfaces/interfaces.js';
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
    console.error('Error creating trip:', error);
    throw handlePrismaError(error);
  }
};
