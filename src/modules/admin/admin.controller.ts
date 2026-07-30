import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as adminService from './admin.service';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.getStats();
  res.status(200).json({ status: 'success', data: stats });
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getUsers({
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
    role: req.query.role as string,
    status: req.query.status as string,
    sortBy: req.query.sortBy as string,
    order: req.query.order as string,
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.getUserById(req.params.userId as string);
  res.status(200).json({ status: 'success', data: { user } });
});

export const banUser = catchAsync(async (req: Request, res: Response) => {
  await adminService.banUser(req.user!.userId, req.params.userId as string, req.body.reason);
  res.status(200).json({ status: 'success', message: 'User banned' });
});

export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  await adminService.unbanUser(req.user!.userId, req.params.userId as string);
  res.status(200).json({ status: 'success', message: 'User unbanned' });
});

export const promoteToAdmin = catchAsync(async (req: Request, res: Response) => {
  await adminService.promoteToAdmin(req.user!.userId, req.params.userId as string);
  res.status(200).json({ status: 'success', message: 'User promoted to admin' });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.user!.userId, req.params.userId as string);
  res.status(200).json({ status: 'success', message: 'User deleted' });
});

export const getMesses = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getMesses({
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
    sortBy: req.query.sortBy as string,
    order: req.query.order as string,
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getMessById = catchAsync(async (req: Request, res: Response) => {
  const mess = await adminService.getMessById(req.params.messId as string);
  res.status(200).json({ status: 'success', data: { mess } });
});

export const deleteMess = catchAsync(async (req: Request, res: Response) => {
  await adminService.deleteMess(req.user!.userId, req.params.messId as string);
  res.status(200).json({ status: 'success', message: 'Mess deleted' });
});

export const transferMess = catchAsync(async (req: Request, res: Response) => {
  await adminService.transferMess(req.user!.userId, req.params.messId as string, req.body.newManagerId);
  res.status(200).json({ status: 'success', message: 'Mess ownership transferred' });
});

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics((req.query.range as string) || '30d');
  res.status(200).json({ status: 'success', data: analytics });
});

export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminService.getSettings();
  res.status(200).json({ status: 'success', data: settings });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminService.updateSettings(req.user!.userId, req.body);
  res.status(200).json({ status: 'success', data: settings });
});
