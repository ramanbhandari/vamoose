import { Request, Response } from 'express';
import { getNotificationsForUser } from '@/models/notification.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';

export const getNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { type } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    // Fetch all unread notifications first
    const unreadNotifications = await getNotificationsForUser(userId, {
      isRead: false,
      type: type as string,
    });

    let notifications = unreadNotifications;

    // Pad with read notifications if there are fewer than 10 unread notifications
    if (unreadNotifications.length < 10) {
      const remainingCount = 10 - unreadNotifications.length;

      const readNotifications = await getNotificationsForUser(userId, {
        isRead: true,
        type: type as string,
        limit: remainingCount,
      });

      notifications = [...unreadNotifications, ...readNotifications];
    }

    res.status(200).json({ notifications });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching notifications:');
  }
};
