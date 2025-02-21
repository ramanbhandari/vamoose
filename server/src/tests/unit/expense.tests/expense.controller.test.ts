import { addExpenseHandler } from '../../../controllers/expense.controller.ts';
import { Request, Response } from 'express';
import prisma from '../../../config/prismaClient.ts';

jest.mock('../../../config/prismaClient.ts', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    expense: {
      create: jest.fn(),
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

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue(true); // mock that User and payer are members of the trip
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
    (prisma.tripMember.findFirst as jest.Mock)
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
    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue(null);

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip.',
    });
  });

  it('should return 404 if paidBy user is not found', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue(true);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'The user who paid is not found.',
    });
  });

  it('should return 403 if some split members are invalid', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue(true);
    (prisma.tripMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user1-id' },
      { userId: 'user2-id' },
    ]); // mock valid split members
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1-id' });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'user1-id' },
      { id: 'invlid-user-id' },
    ]); // trying to split with a user not part of the trip

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Some users included in the split are not members of this trip.',
    });
  });

  it('should return 200 and use all trip members when splitAmongEmails is empty', async () => {
    mockReq = setupRequest();
    mockReq.body.splitAmongEmails = [];

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue(true); // User is a member
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

    expect(prisma.tripMember.findMany).toHaveBeenCalledWith({
      where: { tripId: 1 },
      select: { userId: true },
    });

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

  it('should return 500 on an Internal Server Error', async () => {
    mockReq = setupRequest();
    (prisma.tripMember.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await addExpenseHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });
});
