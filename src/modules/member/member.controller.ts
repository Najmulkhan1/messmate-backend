import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as memberService from './member.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const addMember = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const managerId = req.user!.userId;

  const member = await memberService.addMemberToMess(managerId, email);

  res.status(200).json({
    status: 'success',
    message: 'Member added successfully',
    data: { member },
  });
});

export const getMembers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 404);
  }

  const members = await memberService.getMessMembers(user.messId);

  res.status(200).json({
    status: 'success',
    data: { members },
  });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;
  const memberId = req.params.memberId as string;

  await memberService.removeMember(managerId, memberId);

  res.status(200).json({
    status: 'success',
    message: 'Member removed successfully',
  });
});
