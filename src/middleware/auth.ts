import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'No authentication token provided' });
      return;
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
