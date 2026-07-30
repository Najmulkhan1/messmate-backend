import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) throw new AppError('Unauthorized', 401);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    data: notifications,
  });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) throw new AppError('Unauthorized', 401);

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== userId) {
    throw new AppError('Notification not found', 404);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.status(200).json({
    status: 'success',
    data: updatedNotification,
  });
});
