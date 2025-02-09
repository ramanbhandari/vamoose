import { Request } from "express";

// Subclass of Request which will be passed from the middleware to the backend
// endpoint with a mandatory userId
export interface AuthenticatedRequest extends Request {
    userId: number
}