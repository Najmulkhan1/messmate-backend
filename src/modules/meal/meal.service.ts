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

export const getMealsByDate = async (messId: string, date: string) => {
  const queryDate = new Date(date);
  
  const meals = await prisma.meal.findMany({
    where: {
      messId,
      date: queryDate,
    },
    include: {
      member: { select: { id: true, name: true } }
    }
  });

  return meals;
};
