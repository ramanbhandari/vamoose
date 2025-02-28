import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Custom Middleware for Supabase Authentication & Input Validation
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized: Missing or invalid Authorization header',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as {
      sub: string;
      exp: number;
    };

    if (!decoded.sub) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      res.status(401).json({ error: 'Unauthorized: Token has expired' });
      return;
    }

    // Attach the userId from JWT payload to req
    (req as any).userId = decoded.sub;

    next(); // Proceed to the actual API route
  } catch (error) {
    //console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    console.error(error);
    return;
  }
};
