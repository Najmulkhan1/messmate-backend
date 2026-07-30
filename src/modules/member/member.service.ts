import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const addMemberToMess = async (managerId: string, email: string) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  
  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can add members', 403);
  }

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  
  if (!userToAdd) {
    throw new AppError('User not found with this email', 404);
  }

  if (userToAdd.messId) {
    throw new AppError('This user is already in a mess', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userToAdd.id },
    data: { messId: manager.messId, role: 'MEMBER' },
  });

  return updatedUser;
};

export const getMessMembers = async (messId: string) => {
  const members = await prisma.user.findMany({
    where: { messId },
    select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
  });
  return members;
};

export const removeMember = async (managerId: string, memberId: string) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  
  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can remove members', 403);
  }

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  
  if (!member || member.messId !== manager.messId) {
    throw new AppError('Member not found in your mess', 404);
  }

  if (member.id === managerId) {
    throw new AppError('You cannot remove yourself. Transfer manager role first or delete mess.', 400);
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { messId: null, role: 'MEMBER' },
  });

  return null;
};
