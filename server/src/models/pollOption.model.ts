import prisma from '@/configs/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

export const getPollOptionById = async (pollOptionId: number) => {
  try {
    return await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      select: { id: true, pollId: true },
    });
  } catch (error) {
    console.error('Error fetching poll option:', error);
    throw handlePrismaError(error);
  }
};
