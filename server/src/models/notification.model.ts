import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { NotificationFilterOptions } from '@/interfaces/interfaces.js';

export const getNotificationsForUser = async (
  userId: string,
  filters?: NotificationFilterOptions,
) => {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.tripId && { tripId: filters.tripId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw handlePrismaError(error);
  }
};
