import { createTripHandler } from "../../controllers/tripController";
import prisma from "../../config/prismaClient";
import { Response } from "express";
import { AuthenticatedRequest } from "../../interfaces/authInterface";
import { CreateTripInput } from "../../interfaces/tripInterface";

// Mock Prisma client functions
// Add models->functions you want to mock here
jest.mock("../../config/prismaClient", () => ({
    __esModule: true,
    default: {
        trip: {
            create: jest.fn(),
        },
    },
}));

describe("Trip Controller - createTripHandler (with model)", () => {
    let mockReq: Partial<AuthenticatedRequest<any>>;
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
            userId: 1, //TODO cleanup this field after middleware is implemented
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

        await createTripHandler(mockReq as AuthenticatedRequest<any>, mockRes as Response);

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

        await createTripHandler(mockReq as AuthenticatedRequest<any>, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith({ error: expectedMessage });
    });

    it("should return 500 if database error occurs", async () => {
        mockReq = setupRequest();
        (prisma.trip.create as jest.Mock).mockRejectedValue(new Error("Database error"));

        await createTripHandler(mockReq as AuthenticatedRequest<any>, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });
});

function getXDaysFromToday(x: number): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight

    const roundedX = Math.round(x); // Ensures we only move in full days
    return new Date(today.getTime() + roundedX * 24 * 60 * 60 * 1000);
}