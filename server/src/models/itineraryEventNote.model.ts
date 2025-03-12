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

// Get a note by id
export const getItineraryEventNoteById = async (
  noteId: number,
  eventId: number,
) => {
  try {
    return await prisma.eventNote.findUnique({
      where: { id: noteId, eventId },
    });
  } catch (error) {
    console.error('Error getting event note:', error);
    throw handlePrismaError(error);
  }
};

// Get notes by ids and creator
export const getItineraryEventNotesByIds = async (
  noteIds: number[],
  eventId: number,
  userId: string,
) => {
  try {
    return await prisma.eventNote.findMany({
      where: { id: { in: noteIds }, eventId, createdBy: userId },
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
      data: { content },
    });
  } catch (error) {
    console.error('Error updating event note:', error);
    throw handlePrismaError(error);
  }
};

// Delete a single note
export const deleteItineraryEventNote = async (noteId: number) => {
  try {
    return await prisma.eventNote.delete({
      where: { id: noteId },
    });
  } catch (error) {
    console.error('Error deleting event note:', error);
    throw handlePrismaError(error);
  }
};

// Batch delete multiple notes
export const batchDeleteItineraryEventNotes = async (
  noteIds: number[],
  userId: string,
) => {
  try {
    return await prisma.eventNote.deleteMany({
      where: { id: { in: noteIds }, createdBy: userId },
    });
  } catch (error) {
    console.error('Error batch deleting event notes:', error);
    throw handlePrismaError(error);
  }
};
