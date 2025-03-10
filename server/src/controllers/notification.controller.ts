import { Request, Response } from 'express';
import { getNotificationsForUser } from '@/models/notification.model.js';
import { AuthenticatedRequest } from '@/interfaces/interfaces.js';
import { handleControllerError } from '@/utils/errorHandlers.js';

export const getNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { isRead, type, tripId } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }
    if (isNaN(tripId)) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    const notifications = await getNotificationsForUser(userId, {
      isRead: isRead === 'true',
      type: type as string,
      tripId: tripId ? Number(tripId) : undefined,
    });

    res.status(200).json({ notifications });
  } catch (error) {
    handleControllerError(error, res, 'Error fetching notifications:');
  }
};
