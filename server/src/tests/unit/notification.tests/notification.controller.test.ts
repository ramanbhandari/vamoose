import { Request, Response } from 'express';
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  batchMarkNotificationsAsReadHandler,
  markNotificationAsUnreadHandler,
} from '@/controllers/notification.controller.js';
import {
  getNotificationsForUser,
  markNotificationsAsRead,
  markNotificationsAsUnread,
} from '@/models/notification.model.js';

jest.mock('@/models/notification.model.js');

describe('Get Notifications Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    query: {},
    ...overrides,
  });

  it('should return 200 with notifications data', async () => {
    mockReq = setupRequest({
      query: {
        type: 'EXPENSE_SHARE_SETTLED',
      },
    });

    const mockNotifications = [
      {
        id: 1,
        title: 'Reminder',
        isRead: false,
        type: 'EXPENSE_SHARE_SETTLED',
      },
    ];

    (getNotificationsForUser as jest.Mock)
      .mockResolvedValueOnce(mockNotifications)
      .mockResolvedValueOnce([]);

    await getNotificationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ notifications: mockNotifications });
  });

  it.each([
    {
      scenario: 'User is not authenticated',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      await getNotificationsHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should handle errors and return 500', async () => {
    mockReq = setupRequest();

    (getNotificationsForUser as jest.Mock).mockRejectedValue(
      new Error('Database Error'),
    );

    await getNotificationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });

  // New tests for notification padding and type filtering
  describe('Notification Padding and Type Filtering', () => {
    it('should pad notifications when fewer than 10 unread notifications exist', async () => {
      const unreadNotifications = [
        { id: 1, title: 'Poll created', isRead: false, type: 'POLL_CREATED' },
        {
          id: 2,
          title: 'Poll completed',
          isRead: false,
          type: 'POLL_COMPLETED',
        },
      ];
      const readNotifications = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        title: `Notification ${i + 1}`,
        isRead: true,
        type: 'POLL_CREATED',
      }));

      const paddedNotifications = [
        ...unreadNotifications,
        ...readNotifications,
      ];

      mockReq = setupRequest();

      (getNotificationsForUser as jest.Mock)
        .mockResolvedValueOnce(unreadNotifications)
        .mockResolvedValueOnce(readNotifications);

      await getNotificationsHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        notifications: paddedNotifications,
      });
    });

    it('should return exactly 10 notifications when there are 10 unread notifications', async () => {
      const tenNotifications = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Notification ${i + 1}`,
        isRead: false,
        type: 'POLL_CREATED',
      }));

      mockReq = setupRequest();

      (getNotificationsForUser as jest.Mock).mockResolvedValue(
        tenNotifications,
      );

      await getNotificationsHandler(mockReq as Request, mockRes as Response);

      expect(getNotificationsForUser).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        notifications: tenNotifications,
      });
    });

    it('should filter notifications of type POLL_CREATED', async () => {
      const filteredNotifications = [
        {
          id: 1,
          title: `Poll created Notification`,
          isRead: false,
          type: 'POLL_CREATED',
        },
      ];

      mockReq = setupRequest({
        query: { type: 'POLL_CREATED' },
      });

      (getNotificationsForUser as jest.Mock)
        .mockResolvedValueOnce(filteredNotifications)
        .mockResolvedValueOnce([]);

      await getNotificationsHandler(mockReq as Request, mockRes as Response);

      expect(getNotificationsForUser).toHaveBeenCalledTimes(2);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        notifications: filteredNotifications,
      });
    });
  });
});

describe('Mark Notification As Read Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { notificationId: '1' },
    ...overrides,
  });

  it('should mark a single notification as read successfully', async () => {
    mockReq = setupRequest();

    (markNotificationsAsRead as jest.Mock).mockResolvedValue({
      updatedCount: 1,
    });

    await markNotificationAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Notification marked as read',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await markNotificationAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 404 if notification is not found', async () => {
    mockReq = setupRequest();

    (markNotificationsAsRead as jest.Mock).mockResolvedValue(null);

    await markNotificationAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Notification not found or not authorized',
    });
  });
});

// New tests for marking notifications as unread
describe('Mark Notification As Unread Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { notificationId: '1' },
    ...overrides,
  });

  it('should mark a single notification as unread successfully', async () => {
    mockReq = setupRequest();

    (markNotificationsAsUnread as jest.Mock).mockResolvedValue({
      updatedCount: 1,
    });

    await markNotificationAsUnreadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Notification marked as unread',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await markNotificationAsUnreadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 404 if notification is not found', async () => {
    mockReq = setupRequest();

    (markNotificationsAsUnread as jest.Mock).mockResolvedValue(null);

    await markNotificationAsUnreadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Notification not found or not authorized',
    });
  });
});

describe('Batch Mark Notifications As Read Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    body: { notificationIds: [1, 2, 3] },
    ...overrides,
  });

  it('should mark multiple notifications as read successfully', async () => {
    mockReq = setupRequest();

    (markNotificationsAsRead as jest.Mock).mockResolvedValue({
      updatedCount: 3,
    });

    await batchMarkNotificationsAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Notifications marked as read',
      readNotificationsCount: 3,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await batchMarkNotificationsAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if no notification IDs are provided', async () => {
    mockReq = setupRequest({ body: { notificationIds: [] } });

    await batchMarkNotificationsAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Invalid request: notificationIds must be a non-empty array',
    });
  });

  it('should return 404 if no notifications were updated', async () => {
    mockReq = setupRequest();

    (markNotificationsAsRead as jest.Mock).mockResolvedValue({
      updatedCount: 0,
    });

    await batchMarkNotificationsAsReadHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'No valid notifications found or not authorized',
    });
  });
});
