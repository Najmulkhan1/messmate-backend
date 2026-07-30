import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as bazaarService from './bazaar.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const addBazaar = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const bazaar = await bazaarService.addBazaar(userId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Bazaar expense added successfully',
    data: { bazaar },
  });
});

export const getBazaars = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  const bazaars = await bazaarService.getMessBazaars(user.messId);

  res.status(200).json({
    status: 'success',
    results: bazaars.length,
    data: { bazaars },
  });
});

export const updateBazaar = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const bazaarId = req.params.bazaarId as string;

  const bazaar = await bazaarService.updateBazaar(userId, bazaarId, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Bazaar expense updated successfully',
    data: { bazaar },
  });
});

export const deleteBazaar = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const bazaarId = req.params.bazaarId as string;

  await bazaarService.deleteBazaar(userId, bazaarId);

  res.status(200).json({
    status: 'success',
    message: 'Bazaar expense deleted successfully',
  });
});
