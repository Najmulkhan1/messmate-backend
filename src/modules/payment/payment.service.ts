import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const getMemberPayments = async (memberId: string) => {
  const payments = await prisma.payment.findMany({
    where: { memberId },
    include: {
      bill: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};

export const getMessPayments = async (managerId: string) => {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
  });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can view all payments', 403);
  }

  const payments = await prisma.payment.findMany({
    where: {
      bill: {
        messId: manager.messId,
      },
    },
    include: {
      member: {
        select: { id: true, name: true, phone: true },
      },
      bill: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};

export const submitPayment = async (paymentId: string, memberId: string, method: PaymentMethod, transactionId?: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.memberId !== memberId) {
    throw new AppError('You can only submit your own payments', 403);
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    throw new AppError('Payment is already completed', 400);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      method,
      transactionId: transactionId ?? null,
      // Status remains PENDING until verified by manager
    },
  });

  return updatedPayment;
};

export const verifyPayment = async (paymentId: string, managerId: string, status: PaymentStatus) => {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
  });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can verify payments', 403);
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { bill: true },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.bill.messId !== manager.messId) {
    throw new AppError('Payment does not belong to your mess', 403);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      verifiedBy: status === PaymentStatus.COMPLETED ? manager.id : null,
    },
  });

  // If all payments for the bill are completed, we could update the Bill status
  // but for simplicity, let's just return the updated payment
  
  return updatedPayment;
};
