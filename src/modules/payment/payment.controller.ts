import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const memberId = req.user?.userId;
  if (!memberId) {
    throw new AppError('User not authenticated', 401);
  }

  const payments = await paymentService.getMemberPayments(memberId);

  res.status(200).json({
    status: 'success',
    data: { payments },
  });
});

export const getMessPayments = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user?.userId;
  if (!managerId) {
    throw new AppError('User not authenticated', 401);
  }

  const payments = await paymentService.getMessPayments(managerId);

  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: { payments },
  });
});

export const submitPayment = catchAsync(async (req: Request, res: Response) => {
  const memberId = req.user?.userId;
  if (!memberId) {
    throw new AppError('User not authenticated', 401);
  }

  const paymentId = req.params.id as string;
  const { method, transactionId } = req.body;

  const payment = await paymentService.submitPayment(paymentId, memberId, method, transactionId);

  res.status(200).json({
    status: 'success',
    message: 'Payment submitted successfully',
    data: { payment },
  });
});

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user?.userId;
  if (!managerId) {
    throw new AppError('User not authenticated', 401);
  }

  const paymentId = req.params.id as string;
  const { status } = req.body;

  const payment = await paymentService.verifyPayment(paymentId, managerId, status);

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully',
    data: { payment },
  });
});
