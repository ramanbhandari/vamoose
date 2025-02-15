import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import dotenv from "dotenv";

dotenv.config();

// Custom Middleware for Supabase Authentication & Input Validation
export const authMiddleware = (validations: any[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
                return;
            }

            const token = authHeader.split(" ")[1];

            // Verify the JWT
            const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as { sub: string; exp: number; };

            if (!decoded.sub) {
                res.status(401).json({ error: "Unauthorized: Invalid token" });
                return;
            }

            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp < now) {
                res.status(401).json({ error: "Unauthorized: Token has expired" });
                return;
            }

            // Attach the userId from JWT payload to req
            (req as any).userId = decoded.sub;

            // Run validation checks for the endpoint
            await Promise.all(validations.map((validation) => validation.run(req)));

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            next(); // Proceed to the actual API route

        } catch (error) {
            console.error("Auth Middleware Error:", error);
            res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
            return;
        }
    };
};