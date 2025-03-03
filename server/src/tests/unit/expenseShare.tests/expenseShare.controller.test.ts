import { Request, Response } from 'express';
import {
  getTripDebtsSummaryHandler,
  getUserDebtDetailsHandler,
  settleExpensesHandler,
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
      updateMany: jest.fn(),
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

describe('settleExpensesHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1' },
    body: { shareIds: [1, 2, 3] },
    ...overrides,
  });

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock, json: jsonMock } as Partial<Response>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if the user is not authenticated', async () => {
    req = setupRequest({ userId: undefined });
    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if trip ID is invalid', async () => {
    req = setupRequest({
      params: { tripId: 'invalid' },
    });

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 400 if share IDs are invalid', async () => {
    req = setupRequest({
      body: { shareIds: 'not-an-array' },
    });

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid share IDs' });
  });

  it('should return 403 if the user is not a trip member', async () => {
    req = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it('should return 403 if the user lacks permission to settle expenses', async () => {
    req = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'member',
    });
    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue([
      { expenseId: 1, expense: { paidById: 'another-user' } },
    ]);

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Only the expense creditor, an admin, or the trip creator can settle expenses',
    });
  });

  it('should settle valid expenses and return invalid ones', async () => {
    req = setupRequest({
      body: { shareIds: [1, 2, 3, 4] },
    });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'admin',
    });
    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue([
      { expenseId: 1, expense: { paidById: 'user-123' } },
      { expenseId: 3, expense: { paidById: 'user-123' } },
    ]);

    (prisma.expenseShare.updateMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expenses settled successfully',
      settledCount: 2,
      invalidShareIds: [2, 4],
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    req = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database Error'),
    );

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });

  it.each([
    {
      overrides: { params: { tripId: '1' }, body: { shareIds: [] } },
      expectedError: 'Invalid share IDs',
    },
    {
      overrides: { params: { tripId: '1' }, body: { shareIds: 'invalid' } },
      expectedError: 'Invalid share IDs',
    },
    {
      overrides: { params: { tripId: 'invalid' }, body: { shareIds: [1] } },
      expectedError: 'Invalid trip ID',
    },
  ])(
    'should handle invalid inputs: $input',
    async ({ overrides, expectedError }) => {
      req = setupRequest(overrides);

      // const setupRequest = (overrides = {}) => ({
      //   userId: 'test-user-id',
      //   params: { tripId: '1' },
      //   body: { shareIds: [1, 2, 3] },
      //   ...overrides,
      // });

      await settleExpensesHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedError });
    },
  );
});
