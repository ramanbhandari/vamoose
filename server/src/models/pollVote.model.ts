import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { CastVoteInput, DeleteVoteInput } from '@/interfaces/interfaces.js';
import { DateTime } from 'luxon';

export const castVote = async ({
  pollId,
  pollOptionId,
  userId,
}: CastVoteInput) => {
  try {
    return await prisma.vote.upsert({
      where: {
        pollId_userId: { pollId, userId },
      },
      update: {
        pollOptionId,
        votedAt: DateTime.now().toUTC().toJSDate(),
      },
      create: {
        pollId,
        pollOptionId,
        userId,
      },
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    throw handlePrismaError(error);
  }
};

export const deleteVote = async (options: DeleteVoteInput) => {
  try {
    return await prisma.vote.delete({
      where: {
        pollId_userId: {
          pollId: options.pollId,
          userId: options.userId,
        },
      },
    });
  } catch (error) {
    console.error('Error deleting vote:', error);
    throw handlePrismaError(error);
  }
};
