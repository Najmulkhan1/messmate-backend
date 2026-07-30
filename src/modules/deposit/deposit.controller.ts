import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';

export const addDeposit = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user?.userId;
  const { memberId, amount } = req.body;

  if (!managerId) throw new AppError('Unauthorized', 401);
  if (!memberId || !amount) throw new AppError('memberId and amount are required', 400);

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
  });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can add deposits', 403);
  }

  const member = await prisma.user.findUnique({
    where: { id: memberId },
  });

  if (!member || member.messId !== manager.messId) {
    throw new AppError('Member not found in your mess', 404);
  }

  const deposit = await prisma.$transaction(async (tx) => {
    const newDeposit = await tx.deposit.create({
      data: {
        amount,
        memberId,
        messId: manager.messId!,
      },
    });

    await tx.user.update({
      where: { id: memberId },
      data: {
        depositBalance: {
          increment: amount,
        },
      },
    });

    // Create Notification
    await tx.notification.create({
      data: {
        title: 'Deposit Added',
        message: `A deposit of ${amount} has been added to your account.`,
        userId: memberId,
      },
    });

    return newDeposit;
  });

  res.status(201).json({
    status: 'success',
    data: deposit,
  });
});

export const getDeposits = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { memberId } = req.query;

  if (!userId) throw new AppError('Unauthorized', 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  let deposits;

  if (user.role === 'MANAGER') {
    const filter = memberId ? { messId: user.messId, memberId: String(memberId) } : { messId: user.messId };
    deposits = await prisma.deposit.findMany({
      where: filter,
      include: { member: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Member can only see their own deposits
    deposits = await prisma.deposit.findMany({
      where: { memberId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.status(200).json({
    status: 'success',
    data: deposits,
  });
});
