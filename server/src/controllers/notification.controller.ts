import { Request, Response } from 'express';
import {
  getNotificationsForUser,
  markNotificationsAsRead,
  markNotificationsAsUnread,
  deleteNotifications,
} from '@/models/notification.model.js';
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

// Handler to mark a single notification as read
export const markNotificationAsReadHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!notificationId || isNaN(Number(notificationId))) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const updatedNotifications = await markNotificationsAsRead(
      userId,
      Number(notificationId),
    );

    if (!updatedNotifications || updatedNotifications.updatedCount === 0) {
      res
        .status(404)
        .json({ error: 'Notification not found or not authorized' });
      return;
    }

    res.status(200).json({
      message: 'Notification marked as read',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error marking notification as read:');
  }
};

// Handler to mark multiple notifications as read
export const batchMarkNotificationsAsReadHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { notificationIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }
    const updatedNotifications = await markNotificationsAsRead(
      userId,
      notificationIds,
    );

    if (!updatedNotifications || updatedNotifications.updatedCount === 0) {
      res
        .status(404)
        .json({ error: 'No valid notifications found or not authorized' });
      return;
    }

    res.status(200).json({
      message: 'Notifications marked as read',
      readNotificationsCount: updatedNotifications.updatedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error marking notifications as read:');
  }
};
// Handler to mark a single notification as unread
export const markNotificationAsUnreadHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!notificationId || isNaN(Number(notificationId))) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const updatedNotifications = await markNotificationsAsUnread(
      userId,
      Number(notificationId),
    );

    if (!updatedNotifications || updatedNotifications.updatedCount === 0) {
      res
        .status(404)
        .json({ error: 'Notification not found or not authorized' });
      return;
    }

    res.status(200).json({
      message: 'Notification marked as unread',
    });
  } catch (error) {
    handleControllerError(error, res, 'Error marking notification as unread:');
  }
};

// Handler to delete a single notification
export const deleteNotificationHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    if (!notificationId || isNaN(Number(notificationId))) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const deletedNotifications = await deleteNotifications(
      userId,
      Number(notificationId),
    );

    if (!deletedNotifications || deletedNotifications.deletedCount === 0) {
      res
        .status(404)
        .json({ error: 'Notification not found or not authorized' });
      return;
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
      deletedNotificationsCount: deletedNotifications.deletedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting notification:');
  }
};

// Handler to delete multiple notifications
export const batchDeleteNotificationsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { notificationIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized Request' });
      return;
    }

    const deletedNotifications = await deleteNotifications(
      userId,
      notificationIds,
    );

    if (!deletedNotifications || deletedNotifications.deletedCount === 0) {
      res
        .status(404)
        .json({ error: 'No valid notifications found or not authorized' });
      return;
    }

    res.status(200).json({
      message: 'Notifications deleted successfully',
      deletedNotificationsCount: deletedNotifications.deletedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'Error deleting notifications:');
  }
};
