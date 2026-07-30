import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { MealType } from '@prisma/client';

export const logMeal = async (managerId: string, data: any) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  
  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can log meals for members', 403);
  }

  const member = await prisma.user.findUnique({ where: { id: data.memberId } });
  if (!member || member.messId !== manager.messId) {
    throw new AppError('Member not found in your mess', 404);
  }

  const mealDate = new Date(data.date);
  
  // Upsert to handle if meal already exists
  const meal = await prisma.meal.upsert({
    where: {
      date_type_memberId: {
        date: mealDate,
        type: data.type as MealType,
        memberId: data.memberId,
      },
    },
    update: {
      status: data.status ?? true,
      guestCount: data.guestCount ?? 0,
    },
    create: {
      date: mealDate,
      type: data.type as MealType,
      status: data.status ?? true,
      guestCount: data.guestCount ?? 0,
      memberId: data.memberId,
      messId: manager.messId,
    },
  });

  return meal;
};

export const getMeals = async (messId: string, startDate?: string, endDate?: string, page: number = 1, limit: number = 10) => {
  const whereClause: any = { messId };
  
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      where: whereClause,
      include: {
        member: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.meal.count({ where: whereClause })
  ]);

  return { meals, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const toggleMealStatus = async (userId: string, mealId: string) => {
  const meal = await prisma.meal.findUnique({ where: { id: mealId } });

  if (!meal) throw new AppError('Meal not found', 404);
  if (meal.memberId !== userId) throw new AppError('You can only toggle your own meals', 403);

  // Check deadline (e.g., cannot toggle past or today's meals after a certain time)
  // For simplicity, we just check if the meal date is in the future.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mealDate = new Date(meal.date);
  
  if (mealDate <= today) {
    throw new AppError('Cannot change meal status for today or past dates', 400);
  }

  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: { status: !meal.status },
  });

  return updatedMeal;
};
