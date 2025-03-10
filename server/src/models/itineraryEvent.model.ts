import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { CreateItineraryEventInput } from '@/interfaces/interfaces.js';
import { EventCategory } from '@/interfaces/enums.js';

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
          create: data.assignedUserIds?.map((userId) => ({
            userId,
          })),
        },
        notes: {
          create: data.notes?.map((note) => ({
            content: note.content,
            createdBy: data.createdById,
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

export const getAllItineraryEventsForTrip = async (
  tripId: number,
  filters?: {
    category?: EventCategory;
    startTime?: Date;
    endTime?: Date;
  },
) => {
  try {
    return await prisma.itineraryEvent.findMany({
      where: {
        tripId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.startTime && {
          startTime: {
            gte: filters.startTime,
          },
        }),
        ...(filters?.endTime && {
          endTime: {
            lte: filters.endTime,
          },
        }),
      },
      include: {
        assignedUsers: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        notes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  } catch (error) {
    console.error('Error fetching itinerary events:', error);
    throw handlePrismaError(error);
  }
};

export const getItineraryEventById = async (
  tripId: number,
  eventId: number,
) => {
  try {
    return await prisma.itineraryEvent.findUnique({
      where: { id: eventId, tripId },
      include: {
        assignedUsers: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        notes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching itinerary event by ID:', error);
    throw handlePrismaError(error);
  }
};
