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
        isRead: 'true',
        type: 'REMINDER',
        tripId: '1',
      },
    });

    const mockNotifications = [
      { id: 1, title: 'Reminder', isRead: true, type: 'REMINDER' },
    ];

    (getNotificationsForUser as jest.Mock).mockResolvedValue(mockNotifications);

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
    {
      scenario: 'Invalid trip ID',
      overrides: { query: { tripId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Trip ID must be a valid positive integer',
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
      error: 'Error fetching notifications: Database Error',
    });
  });
});
