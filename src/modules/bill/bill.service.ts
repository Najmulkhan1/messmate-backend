import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { BillStatus } from '@prisma/client';


export const generateMonthlyBill = async (managerId: string, month: number, year: number) => {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    include: {
      managedMess: true,
    },
  });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can generate bills', 403);
  }

  const messId = manager.messId;

  // Check if bill already exists for this month and year
  const existingBill = await prisma.monthlyBill.findUnique({
    where: {
      month_year_messId: {
        month,
        year,
        messId,
      },
    },
  });

  if (existingBill) {
    throw new AppError('A bill for this month and year has already been generated', 400);
  }

  // Get mess details for rent and utilities
  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: {
      members: true,
    },
  });

  if (!mess) {
    throw new AppError('Mess not found', 404);
  }

  const rent = Number(mess.rentAmount || 0);
  const utilities = Number(mess.utilityCost || 0);
  const totalMembers = mess.members.length;

  if (totalMembers === 0) {
    throw new AppError('Cannot generate bill for a mess with no members', 400);
  }

  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  // 1. Calculate Total Bazaar Expenses
  const bazaars = await prisma.bazaar.findMany({
    where: {
      messId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalBazaar = bazaars.reduce((sum, b) => sum + Number(b.amount), 0);

  // 2. Calculate Total Meals (and individual member meals)
  const meals = await prisma.meal.findMany({
    where: {
      messId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: true, // Only count active meals
    },
  });

  const totalMeals = meals.reduce((sum, m) => sum + 1 + m.guestCount, 0);

  // Calculate Meal Rate
  let mealRate = 0;
  if (totalMeals > 0) {
    mealRate = totalBazaar / totalMeals;
  }

  const totalAmount = totalBazaar + rent + utilities;

  // 3. Calculate individual costs and create payments inside a transaction
  const transaction = await prisma.$transaction(async (tx) => {
    // Create the main MonthlyBill record
    const monthlyBill = await tx.monthlyBill.create({
      data: {
        month,
        year,
        rent,
        utilities,
        totalBazaar,
        totalMeals,
        mealRate,
        totalAmount,
        status: BillStatus.GENERATED,
        messId,
      },
    });

    // Create individual Payments (Invoices) for each member
    const sharedFixedCost = (rent + utilities) / totalMembers;

    for (const member of mess.members) {
      // Find meals for this specific member
      const memberMeals = meals.filter((m) => m.memberId === member.id);
      const memberTotalMeals = memberMeals.reduce((sum, m) => sum + 1 + m.guestCount, 0);

      const memberMealCost = memberTotalMeals * mealRate;
      const totalMemberOwes = memberMealCost + sharedFixedCost;

      await tx.payment.create({
        data: {
          amount: totalMemberOwes,
          status: 'PENDING',
          memberId: member.id,
          billId: monthlyBill.id,
        },
      });
    }

    return monthlyBill;
  });

  return transaction;
};

export const getBills = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  const bills = await prisma.monthlyBill.findMany({
    where: { messId: user.messId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      payments: {
        include: {
          member: { select: { id: true, name: true } },
        }
      }
    }
  });

  return bills;
};
