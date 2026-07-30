import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';

declare global {
  namespace Express {
    interface Request {
      messId?: string;
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const requireMessAccess = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Not authenticated', 401));

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.messId) {
      return next(new AppError('You are not part of any mess', 403));
    }

    req.messId = user.messId;
    next();
  } catch (err) {
    next(err);
  }
};
