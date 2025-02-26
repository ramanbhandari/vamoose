import {
  addExpenseHandler,
  fetchSingleExpenseHandler,
  deleteSingleExpenseHandler,
  deleteMultipleExpensesHandler,
} from '../../../controllers/expense.controller.ts';
import { Request, Response } from 'express';
import prisma from '../../../config/prismaClient.ts';
import { NotFoundError } from '../../../utils/errors.ts';

jest.mock('../../../config/prismaClient.ts', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    expense: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    expenseShare: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Expense API - Add Expense', () => {
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
    params: { tripId: '1' },
    body: {
      amount: 100,
      category: 'Food',
      description: 'Lunch',
      paidByEmail: 'payer@example.com',
      splitAmongEmails: ['user1@example.com', 'user2@example.com'],
    },
    ...overrides,
  });

  it('should add an expense successfully', async () => {
    mockReq = setupRequest();
    const fakeExpense = { id: 1, ...mockReq.body };

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true); // mock that User and payer are members of the trip
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user1-id' },
      { userId: 'user2-id' },
    ]); // mock valid split members
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'payer-id' }); // mock valid payer
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'user1-id' },
      { id: 'user2-id' },
    ]); // mock valid split members
    (prisma.expense.create as jest.Mock).mockResolvedValue(fakeExpense);

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expense added successfully',
      expense: fakeExpense,
    });
  });

  it.each([
    {
      scenario: 'Invalid userId',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized request',
    },
    {
      scenario: 'Invalid tripId',
      overrides: { params: { tripId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Missing amount field',
      overrides: { body: { amount: undefined, category: 'Food' } },
      expectedStatus: 400,
      expectedMessage: 'Missing required fields',
    },
    {
      scenario: 'Missing category field',
      overrides: { body: { amount: 100, category: undefined } },
      expectedStatus: 400,
      expectedMessage: 'Missing required fields',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      await addExpenseHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if the paidBy user is not a trip member', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(true) // Requesting user is a member
      .mockResolvedValueOnce(null); // PaidBy user is NOT a member
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'payer-id' }); // PaidBy user exists

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'The person who paid must be a member of the trip.',
    });
  });

  it('should return 403 if request user is not a member of the trip', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip.',
    });
  });

  it('should return 404 if paidBy user is not found', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'The user who paid is not found.',
    });
  });

  it('should return 403 if some split members are invalid', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'user1-id' },
    ]);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1-id' });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'user1-id' },
      { id: 'invlid-user-id' },
    ]); // trying to split with a user not part of the trip

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Some provided emails included in the split are not members of this trip.',
    });
  });

  it('should return 200 and use all trip members when splitAmongEmails is empty', async () => {
    mockReq = setupRequest();
    mockReq.body.splitAmongEmails = [];

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true); // User is a member
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'payer-id' }); // PaidBy user is valid
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'member1' },
      { userId: 'member2' },
      { userId: 'member3' },
    ]); // Mock all trip members

    (prisma.expense.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockReq.body,
      shares: [
        { userId: 'member1', share: 33.33 },
        { userId: 'member2', share: 33.33 },
        { userId: 'member3', share: 33.33 },
      ],
    });

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(prisma.tripMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tripId: 1 } }),
    );
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expense added successfully',
      expense: {
        id: 1,
        ...mockReq.body,
        shares: [
          { userId: 'member1', share: 33.33 },
          { userId: 'member2', share: 33.33 },
          { userId: 'member3', share: 33.33 },
        ],
      },
    });
  });

  it('should return 500 on unexpected database error', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});

describe('Expense API - Fetch Single Expense', () => {
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

  const setupRequest = (tripId: any, expenseId: any, overrides = {}) => ({
    params: { tripId: tripId.toString(), expenseId: expenseId.toString() },
    userId: '69',
    ...overrides,
  });

  it('should fetch an expense successfully', async () => {
    const fakeExpense = {
      id: 9,
      amount: 100,
      category: 'Food',
      description: 'Lunch at a restaurant',
      createdAt: '2025-02-21T01:22:44.505Z',
      tripId: 1,
      paidById: '69',
    };
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.expense.findUnique as jest.Mock).mockResolvedValue(fakeExpense);

    mockReq = setupRequest(1, 9);

    console.log('Mock request:', mockReq);

    await fetchSingleExpenseHandler(mockReq as Request, mockRes as Response);

    // Log response for debugging
    console.log('Mock response:', mockRes);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expense fetched successfully',
      expense: fakeExpense,
    });
  });

  it.each([
    {
      scenario: 'Invalid expenseId',
      overrides: { params: { tripId: 1, expenseId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID',
    },
    {
      scenario: 'Invalid tripId',
      overrides: { params: { tripId: 'invalid', expenseId: 1 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Missing tripId',
      overrides: { params: { expenseId: 4 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Missing expenseId',
      overrides: { params: { tripId: 1 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(1, 9, overrides);

      await fetchSingleExpenseHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if the user is not part of the trip', async () => {
    mockReq = setupRequest(1, 9);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await fetchSingleExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip.',
    });
  });

  it('should return 500 on an Internal Server Error', async () => {
    mockReq = setupRequest(1, 9);
    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await fetchSingleExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });
});

describe('Expense API - Delete Single Expense', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  function setupRequest(overrides = {}) {
    return {
      userId: '1',
      params: { tripId: '1', expenseId: '1' },
      ...overrides,
    };
  }
  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  it('should delete an expense successfully', async () => {
    mockReq = setupRequest();
    const expenseData = {
      id: 1,
      amount: 100,
      category: 'Food',
      description: 'Lunch at a restaurant',
      createdAt: new Date().toISOString(),
      tripId: 1,
    };
    (prisma.expenseShare.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.expense.findUnique as jest.Mock).mockResolvedValue(expenseData);
    (prisma.expense.delete as jest.Mock).mockResolvedValue(expenseData);

    await deleteSingleExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expense deleted successfully',
      expense: expenseData,
    });
  });

  it.each([
    {
      scenario: 'Invalid expenseId',
      overrides: { params: { tripId: 1, expenseId: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID',
    },
    {
      scenario: 'Invalid tripId',
      overrides: { params: { tripId: 'invalid', expenseId: 1 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Missing tripId',
      overrides: { params: { expenseId: 4 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid trip ID',
    },
    {
      scenario: 'Missing expenseId',
      overrides: { params: { tripId: 1 } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      await fetchSingleExpenseHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 403 if a user not part of the expense split tries to delete', async () => {
    const expenseData = {
      id: 1,
      amount: 100,
      category: 'Food',
      description: 'Lunch at a restaurant',
      createdAt: new Date().toISOString(),
      tripId: 1,
    };
    (prisma.expense.findUnique as jest.Mock).mockResolvedValue(expenseData);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: '2',
      tripId: 1,
    });
    (prisma.expenseShare.findUnique as jest.Mock).mockResolvedValue(null);

    mockReq = setupRequest();

    await deleteSingleExpenseHandler(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not included in this expense split',
    });
  });

  it('should return 403 if a user not included in the trip to delete', async () => {
    const expenseData = {
      id: 1,
      amount: 100,
      category: 'Food',
      description: 'Lunch at a restaurant',
      createdAt: new Date().toISOString(),
      tripId: 1,
    };
    (prisma.expense.findUnique as jest.Mock).mockResolvedValue(expenseData);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);
    mockReq = setupRequest();

    await deleteSingleExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip',
    });
  });

  it('should return 404 if expense not found', async () => {
    mockReq = setupRequest();
    (prisma.expenseShare.findUnique as jest.Mock).mockResolvedValue(true);

    (prisma.expense.findUnique as jest.Mock).mockRejectedValue(
      new NotFoundError('Expense not found'),
    );
    (prisma.expense.delete as jest.Mock).mockRejectedValue(
      new NotFoundError('Expense not found'),
    );

    await deleteSingleExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Expense not found' });
  });

  it('should return 500 if database error occurs', async () => {
    mockReq = setupRequest();
    (prisma.expenseShare.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });
});

describe('Expense API - Delete Multiple Expense', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  function setupRequest(overrides = {}) {
    return {
      userId: 1,
      body: {
        expenseIds: [1, 2, 3],
      },
      params: { tripId: '1' },
      ...overrides,
    };
  }

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  it('should delete multiple expenses successfully', async () => {
    mockReq = setupRequest({
      params: { tripId: '1' },
      body: { expenseIds: [1, 2, 3] },
      userId: '1',
    });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue([
      { id: 1, tripId: 1 },
      { id: 2, tripId: 1 },
      { id: 3, tripId: 1 },
    ]);

    (prisma.expenseShare.findMany as jest.Mock).mockResolvedValue([
      { expenseId: 1, userId: '1' },
      { expenseId: 2, userId: '1' },
      { expenseId: 3, userId: '1' },
    ]);

    (prisma.expense.deleteMany as jest.Mock).mockResolvedValue({
      count: 3,
    });

    await deleteMultipleExpensesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Expenses deleted successfully',
      deletedCount: 3,
    });
  });

  it('should return 403 if user is not a member of the trip', async () => {
    mockReq = setupRequest({ body: { expenseIds: [1, 2, 3] } });

    (prisma.expense.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await deleteMultipleExpensesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it.each([
    {
      scenario: 'missing userId',
      overrides: { userId: undefined },
      expectedStatus: 401,
      expectedMessage: 'Unauthorized Request',
    },
    {
      scenario: 'invalid expense IDs format (not an array)',
      overrides: { body: { tripIds: 'invalid' } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID list',
    },
    {
      scenario: 'empty expense IDs array',
      overrides: { body: { tripIds: [] } },
      expectedStatus: 400,
      expectedMessage: 'Invalid expense ID list',
    },
  ])(
    '[$scenario] → should return $expectedStatus',
    async ({ overrides, expectedStatus, expectedMessage }) => {
      mockReq = setupRequest(overrides);

      await deleteMultipleExpensesHandler(
        mockReq as Request,
        mockRes as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    },
  );

  it('should return 500 if database error occurs', async () => {
    mockReq = setupRequest({
      params: { tripId: '1' },
      body: { expenseIds: [1, 2, 3] },
      userId: '1',
    });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(true);
    (prisma.expense.findMany as jest.Mock).mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);

    (prisma.expense.deleteMany as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await deleteMultipleExpensesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'An unexpected database error occurred.',
    });
  });
});
