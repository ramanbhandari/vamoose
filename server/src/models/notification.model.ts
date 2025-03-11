import prisma from '@/config/prismaClient.js';
import { handlePrismaError } from '@/utils/errorHandlers.js';
import { NotificationFilterOptions } from '@/interfaces/interfaces.js';
import { DateTime } from 'luxon';

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

export const markNotificationsAsRead = async (
  userId: string,
  notificationIds: number | number[], // Accepts both a single ID and an array
) => {
  try {
    const idsArray = Array.isArray(notificationIds)
      ? notificationIds
      : [notificationIds];

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: idsArray },
        userId,
        isRead: false, // Only update unread notifications
      },
      data: {
        isRead: true,
        readAt: DateTime.now().toUTC().toJSDate(),
      },
    });

    return result.count > 0 ? { updatedCount: result.count } : null;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw handlePrismaError(error);
  }
};

export const markNotificationsAsUnread = async (
  userId: string,
  notificationIds: number | number[], // Accepts both a single ID and an array
) => {
  try {
    const idsArray = Array.isArray(notificationIds)
      ? notificationIds
      : [notificationIds];

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: idsArray },
        userId,
        isRead: true, // Only update read notifications
      },
      data: {
        isRead: false,
        readAt: null,
      },
    });

    return result.count > 0 ? { updatedCount: result.count } : null;
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    throw handlePrismaError(error);
  }
};
