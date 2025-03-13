import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';

// Add a note to an event
export const addNoteToItineraryEvent = async (
  eventId: number,
  userId: string,
  content: string,
) => {
  try {
    return await prisma.eventNote.create({
      data: {
        eventId,
        createdBy: userId,
        content,
      },
    });
  } catch (error) {
    console.error('Error adding event note:', error);
    throw handlePrismaError(error);
  }
};
