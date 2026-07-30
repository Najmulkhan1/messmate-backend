import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as messService from './mess.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const createMess = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const mess = await messService.createMess(userId, req.body);

  res.status(201).json({
    status: 'success',
    data: { mess },
  });
});

export const getMyMess = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.messId) {
    return res.status(404).json({ status: 'fail', message: 'You are not part of any mess' });
  }

  const mess = await messService.getMessById(user.messId);

  res.status(200).json({
    status: 'success',
    data: { mess },
  });
});

export const getAvailableMesses = catchAsync(async (req: Request, res: Response) => {
  const { division, district, subDistrict, search } = req.query;

  const messes = await messService.getAvailableMesses({
    division: division as string | undefined,
    district: district as string | undefined,
    subDistrict: subDistrict as string | undefined,
    search: search as string | undefined,
  });

  res.status(200).json({
    status: 'success',
    data: { messes },
  });
});

export const updateMess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    return next(new AppError('You are not part of any mess', 404));
  }

  const mess = await messService.updateMess(user.messId, userId, req.body);

  res.status(200).json({
    status: 'success',
    data: { mess },
  });
});
