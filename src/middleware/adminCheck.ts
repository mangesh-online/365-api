import { Response, NextFunction } from 'express';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from './auth.js';

const userRepository = AppDataSource.getRepository(User);

export const adminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};
