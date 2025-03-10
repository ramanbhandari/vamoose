import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { UpdateTripMemberInput } from '@/interfaces/interfaces.js';

interface CreateItineraryEventInput {
  tripId: number;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime?: Date;
  category: string;
  createdById: string;
  assignedUserIds: string[];
  notes?: { content: string; createdBy: string }[];
}

export const createItineraryEvent = async (data: CreateItineraryEventInput) => {
  try {
    return await prisma.itineraryEvent.create({
      data: {
        tripId: data.tripId,
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime,
        endTime: data.endTime,
        category: data.category,
        createdById: data.createdById,
        assignedUsers: {
          create: data.assignedUserIds.map((userId) => ({
            userId,
          })),
        },
        notes: {
          create: data.notes?.map((note) => ({
            content: note.content,
            createdBy: note.createdBy,
          })),
        },
      },
      include: {
        assignedUsers: true,
        notes: true,
      },
    });
  } catch (error) {
    console.error('Error creating itinerary event:', error);
    throw handlePrismaError(error);
  }
};
