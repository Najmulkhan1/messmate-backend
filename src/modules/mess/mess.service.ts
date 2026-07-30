import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const createMess = async (userId: string, data: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.messId) {
    throw new AppError('You are already part of a mess. You cannot create a new one.', 400);
  }

  // Use a transaction to create the mess and set the creator as the MANAGER
  const result = await prisma.$transaction(async (tx) => {
    const newMess = await tx.mess.create({
      data: {
        name: data.name,
        address: data.address,
        rentAmount: data.rentAmount || 0,
        utilityCost: data.utilityCost || 0,
        managerId: userId,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        messId: newMess.id,
        role: 'MANAGER',
      },
    });

    return newMess;
  });

  return result;
};

export const getMessById = async (messId: string) => {
  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      members: { select: { id: true, name: true, role: true } },
    },
  });

  if (!mess) {
    throw new AppError('Mess not found', 404);
  }

  return mess;
};

export const updateMess = async (messId: string, managerId: string, data: any) => {
  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  
  if (!mess) {
    throw new AppError('Mess not found', 404);
  }

  if (mess.managerId !== managerId) {
    throw new AppError('Only the mess manager can update mess details', 403);
  }

  const updatedMess = await prisma.mess.update({
    where: { id: messId },
    data,
  });

  return updatedMess;
};
