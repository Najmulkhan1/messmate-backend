import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as billService from './bill.service';

export const generateBill = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;
  const { month, year } = req.body;

  const bill = await billService.generateMonthlyBill(managerId, month, year);

  res.status(201).json({
    status: 'success',
    data: { bill },
  });
});

export const getBills = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const bills = await billService.getBills(userId);

  res.status(200).json({
    status: 'success',
    data: { bills },
  });
});
