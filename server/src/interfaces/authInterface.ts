import { Request } from "express";

// Generic interface for authenticated requests with different body types
export interface AuthenticatedRequest<T = any> extends Request {
    userId: number; // The authenticated user's Id
    body: T; // The request body can be any type
}