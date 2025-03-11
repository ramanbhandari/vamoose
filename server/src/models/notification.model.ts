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
        ...(filters?.isRead && { isRead: filters.isRead }),
        ...(filters?.type && { type: filters.type }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw handlePrismaError(error);
  }
};
