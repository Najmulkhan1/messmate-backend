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
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    throw new AppError('Please provide a valid date query parameter (ISO Date)', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 404);
  }

  const meals = await mealService.getMealsByDate(user.messId, date);

  res.status(200).json({
    status: 'success',
    data: { meals },
  });
});
