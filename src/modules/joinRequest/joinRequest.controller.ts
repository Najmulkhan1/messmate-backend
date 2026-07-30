import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as joinRequestService from './joinRequest.service';

export const sendRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { messId } = req.body;

  const request = await joinRequestService.sendRequest(userId, messId);

  res.status(201).json({
    status: 'success',
    message: 'Join request sent successfully',
    data: { request },
  });
});

export const getPendingRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const requests = await joinRequestService.getPendingRequests(userId);

  res.status(200).json({
    status: 'success',
    data: { requests },
  });
});

export const acceptRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  await joinRequestService.acceptRequest(userId, id);

  res.status(200).json({
    status: 'success',
    message: 'Request accepted successfully',
  });
});

export const rejectRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  await joinRequestService.rejectRequest(userId, id);

  res.status(200).json({
    status: 'success',
    message: 'Request rejected successfully',
  });
});
