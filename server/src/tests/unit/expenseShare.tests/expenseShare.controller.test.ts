import { Request, Response } from 'express';
import {
  getTripDebtsSummaryHandler,
  getUserDebtDetailsHandler,
} from '@/controllers/expenseShare.controller.js';
import prisma from '@/config/prismaClient.js';

// Mock the specific Prisma client methods
jest.mock('../../../config/prismaClient', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
    },
    expenseShare: {
      findMany: jest.fn(),
    },
  },
}));

describe('Trip Debt Summary Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockExpenseShares = [
    {
      share: 100,
      settled: false,
      expense: {
        description: 'Dinner at the resort',
        category: 'food',
        paidBy: {
          email: 'creditor1@test.com',
        },
      },
      user: {
        email: 'debtor1@test.com',
      },
    },
  ];
  const mockTripDebtSummary = [
    {
      debtorEmail: 'debtor1@test.com',
      outstanding: [
        {
          creditorEmail: 'creditor1@test.com',
          creditorId: '',
          amount: 100,
          description: 'Dinner at the resort',
          category: 'food',
          settled: false,
        },
      ],
      settled: [],
      totalOwed: 100,
    },
  ];
  const mockUserDebtSummary = {
    details: {
      outstanding: [
        {
          amount: 100,
          category: 'food',
          creditorId: '',
          creditorEmail: 'creditor1@test.com',
          description: 'Dinner at the resort',
          settled: false,
        },
      ],
      settled: [],
      totalOwed: 100,
    },
  };

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1' },
    ...overrides,
  });

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTripDebtsSummaryHandler', () => {
    it('should return 200 with the owed summary data', async () => {
      req = setupRequest();

      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);

      (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue(
        mockExpenseShares,
      );

      await getTripDebtsSummaryHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ summary: mockTripDebtSummary });
    });

    it.each([
      {
        scenario: 'Invalid userId',
        overrides: { userId: undefined },
        expectedStatus: 401,
        expectedMessage: 'Unauthorized Request',
      },
      {
        scenario: 'Invalid tripId',
        overrides: { params: { tripId: 'invalid' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid trip ID',
      },
    ])(
      '[$scenario] → should return $expectedStatus',
      async ({ overrides, expectedStatus, expectedMessage }) => {
        req = setupRequest(overrides);

        await getTripDebtsSummaryHandler(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
      },
    );
  });

  describe('getUserDebtDetailsHandler', () => {
    it('should return 200 with the user owed summary data', async () => {
      req = setupRequest({
        params: { tripId: '1', userId: 'target-user-id' },
      });
      (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);

      (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue(
        mockExpenseShares,
      );

      await getUserDebtDetailsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUserDebtSummary);
    });

    it.each([
      {
        scenario: 'Invalid userId',
        overrides: { userId: undefined },
        expectedStatus: 401,
        expectedMessage: 'Unauthorized Request',
      },
      {
        scenario: 'Invalid tripId',
        overrides: { params: { tripId: 'invalid' } },
        expectedStatus: 400,
        expectedMessage: 'Invalid trip ID',
      },
    ])(
      '[$scenario] → should return $expectedStatus',
      async ({ overrides, expectedStatus, expectedMessage }) => {
        req = setupRequest(overrides);

        await getUserDebtDetailsHandler(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
      },
    );
  });
});
