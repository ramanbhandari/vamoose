import {
  createMarkedLocationHandler,
  getAllMarkedLocationsHandler,
  updateMarkedLocationNotesHandler,
  deleteMarkedLocationHandler,
} from '@/controllers/markedLocation.controller.js';
import prisma from '@/config/prismaClient.js';
import { Request, Response } from 'express';
import { LocationType } from '@prisma/client';

jest.mock('@/config/prismaClient.js', () => ({
  __esModule: true,
  default: {
    tripMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    markedLocation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('MarkedLocation API - Create Location', () => {
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

    jest.clearAllMocks();
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1' },
    body: {
      name: 'Great Restaurant',
      type: 'RESTAURANT',
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: '123 Main St, San Francisco, CA',
      notes: 'Great place for dinner',
      website: 'https://example.com',
      phoneNumber: '123-456-7890',
    },
    ...overrides,
  });

  it('should create a marked location successfully', async () => {
    mockReq = setupRequest();
    const fakeLocation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ...mockReq.body,
      createdById: 'test-user-id',
      tripId: 1,
      type: LocationType.RESTAURANT,
    };

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      tripId: 1,
      role: 'member',
    });
    (prisma.markedLocation.create as jest.Mock).mockResolvedValue(fakeLocation);

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked location created successfully',
      markedLocation: fakeLocation,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({
      params: { tripId: 'invalid' },
    });

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 403 if user is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it('should handle an invalid location type gracefully', async () => {
    mockReq = setupRequest({
      body: {
        name: 'Great Restaurant',
        type: 'INVALID_TYPE', // Invalid type
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
    });

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      tripId: 1,
      role: 'member',
    });

    const fakeLocation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Great Restaurant',
      type: LocationType.OTHER, // Should default to OTHER
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      createdById: 'test-user-id',
      tripId: 1,
    };

    (prisma.markedLocation.create as jest.Mock).mockResolvedValue(fakeLocation);

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked location created successfully',
      markedLocation: fakeLocation,
    });

    expect(prisma.markedLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: LocationType.OTHER,
        }),
      }),
    );
  });

  it('should return 500 on prismadatabase error', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await createMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(
          'An unexpected database error occurred.',
        ),
      }),
    );
  });
});

describe('MarkedLocation API - Get All Locations', () => {
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

    jest.clearAllMocks();
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1' },
    ...overrides,
  });

  it('should retrieve all marked locations successfully', async () => {
    mockReq = setupRequest();
    const fakeLocations = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Great Restaurant',
        type: LocationType.RESTAURANT,
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        createdById: 'test-user-id',
        tripId: 1,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Awesome Cafe',
        type: LocationType.CAFE,
        coordinates: { latitude: 37.7739, longitude: -122.4184 },
        createdById: 'test-user-id',
        tripId: 1,
      },
    ];

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue({
      tripId: 1,
      userId: 'test-user-id',
    });

    (prisma.markedLocation.findMany as jest.Mock).mockResolvedValue(
      fakeLocations,
    );

    await getAllMarkedLocationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked locations retrieved successfully',
      markedLocations: fakeLocations,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await getAllMarkedLocationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({
      params: { tripId: 'invalid' },
    });

    await getAllMarkedLocationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return empty array if no locations exist', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue({
      tripId: 1,
      userId: 'test-user-id',
    });

    (prisma.markedLocation.findMany as jest.Mock).mockResolvedValue([]);

    await getAllMarkedLocationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked locations retrieved successfully',
      markedLocations: [],
    });
  });

  it('should return 500 on database error', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue({
      tripId: 1,
      userId: 'test-user-id',
    });

    (prisma.markedLocation.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await getAllMarkedLocationsHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(
          'An unexpected database error occurred.',
        ),
      }),
    );
  });
});

describe('MarkedLocation API - Update Location Notes', () => {
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

    jest.clearAllMocks();
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1', locationId: '550e8400-e29b-41d4-a716-446655440000' },
    body: {
      notes: 'Updated notes for the location',
    },
    ...overrides,
  });

  it('should update location notes successfully', async () => {
    mockReq = setupRequest();
    const fakeLocation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Great Restaurant',
      type: LocationType.RESTAURANT,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      notes: 'Original notes',
      createdById: 'test-user-id',
      tripId: 1,
    };

    const updatedLocation = {
      ...fakeLocation,
      notes: 'Updated notes for the location',
    };

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      tripId: 1,
    });
    (prisma.markedLocation.findUnique as jest.Mock).mockResolvedValue(
      fakeLocation,
    );
    (prisma.markedLocation.update as jest.Mock).mockResolvedValue(
      updatedLocation,
    );

    await updateMarkedLocationNotesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked location notes updated successfully',
      updatedLocation,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await updateMarkedLocationNotesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({
      params: {
        tripId: 'invalid',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      },
    });

    await updateMarkedLocationNotesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 403 if user is not a member of the trip', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockResolvedValue(null);

    await updateMarkedLocationNotesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'You are not a member of this trip: 1',
    });
  });

  it('should return 500 on database error', async () => {
    mockReq = setupRequest();

    (prisma.tripMember.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await updateMarkedLocationNotesHandler(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(
          'An unexpected database error occurred.',
        ),
      }),
    );
  });
});

describe('MarkedLocation API - Delete Location', () => {
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

    jest.clearAllMocks();
  });

  const setupRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    params: { tripId: '1', locationId: '550e8400-e29b-41d4-a716-446655440000' },
    ...overrides,
  });

  it('should delete a location successfully', async () => {
    mockReq = setupRequest();
    const fakeLocation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Great Restaurant',
      type: LocationType.RESTAURANT,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      createdById: 'test-user-id',
      tripId: 1,
    };

    (prisma.markedLocation.findUnique as jest.Mock).mockResolvedValue(
      fakeLocation,
    );
    (prisma.tripMember.findFirst as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      tripId: 1,
    });
    (prisma.markedLocation.delete as jest.Mock).mockResolvedValue(fakeLocation);

    await deleteMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Marked location deleted successfully',
      deletedLocation: fakeLocation,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq = setupRequest({ userId: undefined });

    await deleteMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized Request' });
  });

  it('should return 400 if tripId is invalid', async () => {
    mockReq = setupRequest({
      params: {
        tripId: 'invalid',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      },
    });

    await deleteMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid trip ID' });
  });

  it('should return 404 if location is not found', async () => {
    mockReq = setupRequest();

    (prisma.markedLocation.findUnique as jest.Mock).mockResolvedValue(null);

    await deleteMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Marked location not found',
    });
  });

  it('should return 500 on database error', async () => {
    mockReq = setupRequest();

    (prisma.markedLocation.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await deleteMarkedLocationHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(
          'An unexpected database error occurred.',
        ),
      }),
    );
  });
});
