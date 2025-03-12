import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { DateTime } from 'luxon';

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

// Get a note by id
export const getItineraryEventNoteById = async (noteId: number) => {
  try {
    return await prisma.eventNote.findUnique({
      where: { id: noteId },
    });
  } catch (error) {
    console.error('Error getting event note:', error);
    throw handlePrismaError(error);
  }
};

// Update a note
export const updateItineraryEventNote = async (
  noteId: number,
  userId: string,
  content: string,
) => {
  try {
    return await prisma.eventNote.update({
      where: { id: noteId },
      data: { content, updatedAt: DateTime.now().toUTC().toJSDate() },
    });
  } catch (error) {
    console.error('Error updating event note:', error);
    throw handlePrismaError(error);
  }
};
