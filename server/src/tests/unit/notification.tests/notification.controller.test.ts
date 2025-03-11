import { Request, Response } from 'express';
import { getNotificationsHandler } from '@/controllers/notification.controller.js';
import { getNotificationsForUser } from '@/models/notification.model.js';

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
