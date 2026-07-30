import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const addBazaar = async (userId: string, data: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  if (user.role !== 'MANAGER' && !user.canAddBazaar) {
    throw new AppError('You do not have permission to add a bazaar expense. Contact your manager.', 403);
  }

  const bazaar = await prisma.bazaar.create({
    data: {
      date: new Date(data.date),
      items: data.items,
      amount: data.amount,
      description: data.description,
      buyerId: userId,
      messId: user.messId,
    },
  });

  return bazaar;
};

export const getMessBazaars = async (messId: string) => {
  const bazaars = await prisma.bazaar.findMany({
    where: { messId },
    orderBy: { date: 'desc' },
    include: {
      buyer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return bazaars;
};

export const updateBazaar = async (userId: string, bazaarId: string, data: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  const bazaar = await prisma.bazaar.findUnique({ where: { id: bazaarId } });

  if (!bazaar) {
    throw new AppError('Bazaar entry not found', 404);
  }

  if (bazaar.messId !== user.messId) {
    throw new AppError('This bazaar does not belong to your mess', 403);
  }

  // Only manager or the buyer themselves can update
  if (user.role !== 'MANAGER' && bazaar.buyerId !== userId) {
    throw new AppError('You are not allowed to update this bazaar entry', 403);
  }

  const updatedData: any = { ...data };
  if (data.date) {
    updatedData.date = new Date(data.date);
  }

  const updatedBazaar = await prisma.bazaar.update({
    where: { id: bazaarId },
    data: updatedData,
  });

  return updatedBazaar;
};

export const deleteBazaar = async (userId: string, bazaarId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user?.messId) {
    throw new AppError('You are not part of any mess', 400);
  }

  const bazaar = await prisma.bazaar.findUnique({ where: { id: bazaarId } });

  if (!bazaar) {
    throw new AppError('Bazaar entry not found', 404);
  }

  if (bazaar.messId !== user.messId) {
    throw new AppError('This bazaar does not belong to your mess', 403);
  }

  // Only manager or the buyer themselves can delete
  if (user.role !== 'MANAGER' && bazaar.buyerId !== userId) {
    throw new AppError('You are not allowed to delete this bazaar entry', 403);
  }

  await prisma.bazaar.delete({
    where: { id: bazaarId },
  });

  return null;
};
