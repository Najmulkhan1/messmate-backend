import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mess: true },
  });

  if (!user || !user.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  const messId = user.messId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // 1. Total Bazaars
  const bazaars = await prisma.bazaar.findMany({
    where: {
      messId,
      date: { gte: startDate, lte: endDate },
    },
  });
  const totalBazaar = bazaars.reduce((sum, b) => sum + Number(b.amount), 0);

  // 2. Total Meals
  const meals = await prisma.meal.findMany({
    where: {
      messId,
      date: { gte: startDate, lte: endDate },
      status: true,
    },
  });
  const totalMeals = meals.reduce((sum, m) => sum + 1 + m.guestCount, 0);

  // 3. Meal Rate
  const mealRate = totalMeals > 0 ? totalBazaar / totalMeals : 0;

  // 4. User's Total Meals
  const userMealsList = meals.filter((m) => m.memberId === userId);
  const userMealsCount = userMealsList.reduce((sum, m) => sum + 1 + m.guestCount, 0);

  // 5. User's Estimated Cost
  const userEstimatedCost = userMealsCount * mealRate;

  // 6. User Deposit
  const depositBalance = Number(user.depositBalance || 0);

  res.status(200).json({
    status: 'success',
    data: {
      totalMeals,
      totalBazaar,
      mealRate,
      userMealsCount,
      userEstimatedCost,
      depositBalance,
    },
  });
});
