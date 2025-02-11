import { createTripHandler, deleteTripHandler, deleteMultipleTripsHandler, updateTripHandler } from "../../controllers/tripController";
import prisma from "../../config/prismaClient";
import { Response } from "express";
import { AuthenticatedRequest } from "../../interfaces/authInterface";
import { NotFoundError } from "../../utils/errors";

// Mock Prisma client functions
// Add models->functions you want to mock here
jest.mock("../../config/prismaClient", () => ({
    __esModule: true,
    default: {
        trip: {
            create: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe("Trip Controller - createTripHandler (with model)", () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    // Utility function to create request body
    const setupRequest = (overrides = {}) => ({
        body: {
            name: "Test Trip",
            description: "A fun test trip",
            destination: "Hawaii",
            startDate: getXDaysFromToday(0).toISOString(),
            endDate: getXDaysFromToday(7).toISOString(),
            budget: 500,
            userId: 1, // TODO: cleanup this field after middleware is implemented
            ...overrides, // Allows customization for different test cases
        },
    });

    const setupResponse = (tripOverrides = {}, responseOverrides = {}) => (
        {
            message: "Trip created successfully",
            trip: {
                id: 1,
                name: "Test Trip",
                description: "A fun test trip",
                destination: "Hawaii",
                startDate: getXDaysFromToday(0).toISOString(),
                endDate: getXDaysFromToday(7).toISOString(),
                "budget": 500,
                "createdAt": getXDaysFromToday(0).toISOString(),
                "updatedAt": getXDaysFromToday(0).toISOString(),
                "createdBy": 1,
                "members": [
                    {
                        "tripId": 1,
                        "userId": 1,
                        "role": "creator"
                    }
                ],
                ...tripOverrides
            },
            ...responseOverrides
        }
    );

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRes = {
            status: statusMock,
            json: jsonMock,
        } as Partial<Response>;
    });


    it("should create a trip successfully", async () => {
        mockReq = setupRequest();
        const { message, trip } = setupResponse();

        //Mock Prisma DB call inside `createTrip`
        (prisma.trip.create as jest.Mock).mockResolvedValue({
            ...trip,
        });

        await createTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({ message, trip });
    });

    it.each([
        { overrides: { userId: undefined }, expectedStatus: 401, expectedMessage: "Unauthorized Request" },
        { overrides: { name: "" }, expectedStatus: 400, expectedMessage: "Missing required fields" },
        { overrides: { startDate: "invalid-date" }, expectedStatus: 400, expectedMessage: "Invalid start date or end date format" },
        {
            overrides: {
                startDate: getXDaysFromToday(-1).toISOString(),
                endDate: getXDaysFromToday(7).toISOString(),
            },
            expectedStatus: 400,
            expectedMessage: "Start date must be today or in the future",
        },
        {
            overrides: {
                startDate: getXDaysFromToday(8).toISOString(),
                endDate: getXDaysFromToday(7).toISOString(),
            },
            expectedStatus: 400,
            expectedMessage: "Start date must be before end date",
        },
    ])("when request body is $overrides should return $expectedStatus", async ({ overrides, expectedStatus, expectedMessage }) => {
        mockReq = setupRequest(overrides);

        await createTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    });

    it("should return 500 if database error occurs", async () => {
        mockReq = setupRequest();
        (prisma.trip.create as jest.Mock).mockRejectedValue(new Error("Database error"));

        await createTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: "An unexpected database error occurred." });
    });
});

describe("Trip Controller - deleteTripHandler", () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    function setupRequest(overrides = {}) {
        return {
            params: { tripId: "1" },
            body: { userId: 1 }, // TODO: modify this after middleware implementation
            ...overrides
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

    it("should delete a trip successfully", async () => {
        mockReq = setupRequest();

        (prisma.trip.delete as jest.Mock).mockResolvedValue({
            id: 1,
            name: "Deleted Trip",
        });

        await deleteTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Trip deleted successfully",
            trip: { id: 1, name: "Deleted Trip" },
        });
    });

    it.each([
        { overrides: { body: { userId: undefined } }, expectedStatus: 401, expectedMessage: "Unauthorized Request" },
        { overrides: { params: { tripId: "invalid" } }, expectedStatus: 400, expectedMessage: "Invalid trip ID" },
    ])(
        "when request is $overrides should return $expectedStatus",
        async ({ overrides, expectedStatus, expectedMessage }) => {
            mockReq = setupRequest(overrides);

            await deleteTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(expectedStatus);
            expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
        }
    );

    it("should return 404 if trip is not found", async () => {
        mockReq = setupRequest();

        (prisma.trip.delete as jest.Mock).mockRejectedValue(new NotFoundError("Trip not found"));

        await deleteTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Trip not found" });
    });

    it("should return 500 if database error occurs", async () => {
        mockReq = setupRequest();

        (prisma.trip.delete as jest.Mock).mockRejectedValue(new Error("Database error"));

        await deleteTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: "An unexpected database error occurred." });
    });


});

describe("Trip Controller - deleteMultipleTripsHandler", () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    function setupRequest(overrides = {}) {
        return {
            body: {
                userId: 1,  // TODO: modify this after middleware implementation
                tripIds: [1, 2, 3],
                ...overrides
            },
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

    it("should delete multiple trips successfully", async () => {
        mockReq = setupRequest({ tripIds: [1, 2, 3] });

        (prisma.trip.deleteMany as jest.Mock).mockResolvedValue({
            count: 3,
        });

        await deleteMultipleTripsHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Trips deleted successfully",
            deletedCount: 3,
        });
    });

    it.each([
        { overrides: { userId: undefined }, expectedStatus: 401, expectedMessage: "Unauthorized Request" },
        { overrides: { tripIds: "invalid" }, expectedStatus: 400, expectedMessage: "Invalid trip ID list" },
        { overrides: { tripIds: [] }, expectedStatus: 400, expectedMessage: "Invalid trip ID list" },
    ])(
        "when request is $overrides should return $expectedStatus",
        async ({ overrides, expectedStatus, expectedMessage }) => {
            mockReq = setupRequest(overrides);

            await deleteMultipleTripsHandler(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(expectedStatus);
            expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
        }
    );

    it("should return 404 if no trips were deleted", async () => {
        mockReq = setupRequest({ tripIds: [1, 2, 3] });

        (prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

        await deleteMultipleTripsHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "No trips deleted. Either they do not exist or you are not authorized." });
    });

    it("should return 500 if database error occurs", async () => {
        mockReq = setupRequest({ tripIds: [1, 2, 3] });

        (prisma.trip.deleteMany as jest.Mock).mockRejectedValue(new Error("Database error"));

        await deleteMultipleTripsHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: "An unexpected database error occurred." });
    });
});

describe("Trip Controller - updateTripHandler", () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    const setupRequest = (tripId: number, overrides = {}) => ({
        params: { tripId: tripId.toString() },
        body: Object.fromEntries(
            Object.entries({
                userId: 1, // TODO: Modify this after middleware implementation
                name: "Trip Name",
                description: "Trip description",
                budget: 800,
                ...overrides,
            }).filter(([_, v]) => v !== undefined) // Remove undefined fields
        ),
    });

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRes = {
            status: statusMock,
            json: jsonMock,
        } as Partial<Response>;
    });

    it("should update a trip successfully", async () => {
        mockReq = setupRequest(1);

        (prisma.trip.update as jest.Mock).mockResolvedValue({
            id: 1,
            name: "Updated Trip Name",
            description: "Updated description",
            budget: 800,
            createdBy: 1,
        });

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Trip updated successfully",
            trip: {
                id: 1,
                name: "Updated Trip Name",
                description: "Updated description",
                budget: 800,
                createdBy: 1,
            },
        });
    });

    it("should return 400 if no fields are provided for update", async () => {
        mockReq = setupRequest(1, { name: undefined, description: undefined, budget: undefined }); // No update fields

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: "No fields provided for update" });
    });

    it("should return 400 if tripId is invalid", async () => {
        mockReq = setupRequest(NaN);

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid trip ID" });
    });

    it("should return 401 if user is not authenticated", async () => {
        mockReq = setupRequest(1, { userId: undefined });

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized Request" });
    });

    it("should return 404 if the trip does not exist", async () => {
        mockReq = setupRequest(999); // Non-existent trip ID

        (prisma.trip.update as jest.Mock).mockRejectedValue(
            new NotFoundError("Record not found.")
        );

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Record not found." });
    });

    it("should return 500 if a generic database error occurs", async () => {
        mockReq = setupRequest(1);

        (prisma.trip.update as jest.Mock).mockRejectedValue(new Error("Database failure"));

        await updateTripHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: "An unexpected database error occurred." });
    });
});

function getXDaysFromToday(x: number): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight

    const roundedX = Math.round(x); // Ensures we only move in full days
    return new Date(today.getTime() + roundedX * 24 * 60 * 60 * 1000);
}