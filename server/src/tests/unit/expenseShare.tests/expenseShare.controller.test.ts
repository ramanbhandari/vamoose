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
      update: jest.fn(),
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

describe('Settle Expenses Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockExpenseShares = [
    {
      expenseId: 1,
      userId: 'debtor1',
      expense: { paidById: 'creditor1' },
    },
    {
      expenseId: 2,
      userId: 'debtor2',
      expense: { paidById: 'creditor1' },
    },
  ];

  const mockRequestingMember = { role: 'creator' };

  const setupRequest = (overrides = {}) => ({
    userId: 'creditor1',
    params: { tripId: '1' },
    body: {
      expensesToSettle: [
        { expenseId: 1, debtorUserId: 'debtor1' },
        { expenseId: 2, debtorUserId: 'debtor2' },
        { expenseId: 3, debtorUserId: 'invalidDebtor' }, // Invalid
      ],
    },
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

  it('should settle valid expenses and ignore invalid ones', async () => {
    req = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(
      mockRequestingMember,
    );
    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue(
      mockExpenseShares,
    );
    (prisma.expenseShare.update as jest.Mock).mockResolvedValue({ count: 2 });

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expenses settled successfully',
      settledCount: 2,
      settledExpenses: [
        { expenseId: 1, debtorUserId: 'debtor1' },
        { expenseId: 2, debtorUserId: 'debtor2' },
      ],
      poorlyFormattedExpenses: [],
      nonExistentExpensePairs: [
        { expenseId: 3, debtorUserId: 'invalidDebtor' },
      ],
      unauthorizedExpensePairs: [],
    });
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
    {
      scenario: 'Invalid expensesToSettle format',
      overrides: { body: { expensesToSettle: 'invalid-format' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expensesToSettle array provided',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      req = setupRequest(overrides);

      await settleExpensesHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should handle unauthorized user trying to settle expenses', async () => {
    req = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it('should handle no valid expenses found to settle', async () => {
    req = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(
      mockRequestingMember,
    );
    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue([]);

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'No valid, unsettled expense shares found to settle',
      nonExistentExpensePairs: [
        { expenseId: 1, debtorUserId: 'debtor1' },
        { expenseId: 2, debtorUserId: 'debtor2' },
        { expenseId: 3, debtorUserId: 'invalidDebtor' },
      ],
    });
  });

  it('should handle unauthorized expense settlement attempts', async () => {
    req = setupRequest({ userId: 'not-the-creditor' });
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      role: 'member',
    });
    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue(
      mockExpenseShares,
    );

    await settleExpensesHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not authorized to settle any of these expenses',
      unauthorizedExpensePairs: [
        { expenseId: 1, debtorUserId: 'debtor1' },
        { expenseId: 2, debtorUserId: 'debtor2' },
      ],
      poorlyFormattedExpenses: [],
      nonExistentExpensePairs: [
        {
          debtorUserId: 'invalidDebtor',
          expenseId: 3,
        },
      ],
    });
  });
});
