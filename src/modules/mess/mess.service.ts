import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const createMess = async (userId: string, data: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.messId) {
    throw new AppError('You are already part of a mess. You cannot create a new one.', 400);
  }

  if (user?.role === 'MEMBER') {
    throw new AppError('Members cannot create a mess. Ask a manager to add you.', 403);
  }

  // Use a transaction to create the mess and set the creator as the MANAGER
  const result = await prisma.$transaction(async (tx) => {
    const newMess = await tx.mess.create({
      data: {
        name: data.name,
        address: data.address,
        division: data.division,
        district: data.district,
        subDistrict: data.subDistrict,
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

export const getAvailableMesses = async (filters?: {
  division?: string | undefined;
  district?: string | undefined;
  subDistrict?: string | undefined;
  search?: string | undefined;
}) => {
  const where: any = {};

  if (filters?.division) {
    where.division = { equals: filters.division, mode: 'insensitive' };
  }
  if (filters?.district) {
    where.district = { equals: filters.district, mode: 'insensitive' };
  }
  if (filters?.subDistrict) {
    where.subDistrict = { equals: filters.subDistrict, mode: 'insensitive' };
  }
  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  const messes = await prisma.mess.findMany({
    where,
    select: {
      id: true,
      name: true,
      division: true,
      district: true,
      subDistrict: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return messes.map((m) => ({
    id: m.id,
    name: m.name,
    division: m.division,
    district: m.district,
    subDistrict: m.subDistrict,
    memberCount: m._count.members,
  }));
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
