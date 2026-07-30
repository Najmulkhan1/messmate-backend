import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as mealService from './meal.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const logMeal = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;
  const meal = await mealService.logMeal(managerId, req.body);

  res.status(201).json({
    status: 'success',
    data: { meal },
  });
});

export const getMeals = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { startDate, endDate, page, limit } = req.query;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 404);
  }

  const p = page ? Number(page) : 1;
  const l = limit ? Number(limit) : 10;

  const result = await mealService.getMeals(user.messId, startDate as string, endDate as string, p, l);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const toggleMeal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const mealId = req.params.id as string;

  const meal = await mealService.toggleMealStatus(userId, mealId);

  res.status(200).json({
    status: 'success',
    message: `Meal successfully turned ${meal.status ? 'ON' : 'OFF'}`,
    data: { meal },
  });
});
