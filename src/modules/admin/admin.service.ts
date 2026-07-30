import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

async function logAdminAction(adminId: string, action: string, targetType: string, targetId: string, details?: any) {
  await prisma.adminLog.create({ data: { adminId, action, targetType, targetId, details } });
}

export const getStats = async () => {
  const [totalUsers, totalMesses, totalMealsThisMonth, totalBazaarThisMonth, userDistribution] = await Promise.all([
    prisma.user.count({ where: { isBanned: false } }),
    prisma.mess.count(),
    prisma.meal.count({ where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.bazaar.aggregate({
      _sum: { amount: true },
      where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
  ]);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const activeUsersToday = await prisma.user.count({ where: { lastActiveAt: { gte: todayStart } } });

  const last12Months: { month: string; users: number; messes: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const [users, messes] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.mess.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);
    last12Months.push({ month: d.toLocaleString('default', { month: 'short' }), users, messes });
  }

  const dist = { members: 0, managers: 0, admins: 0 };
  userDistribution.forEach((g) => { if (g.role === 'MEMBER') dist.members = g._count; else if (g.role === 'MANAGER') dist.managers = g._count; else dist.admins = g._count; });

  return {
    totalUsers, totalMesses, activeUsersToday,
    totalMealsThisMonth,
    totalBazaarThisMonth: totalBazaarThisMonth._sum.amount || 0,
    userGrowth: last12Months,
    userDistribution: dist,
  };
};

export const getUsers = async (params: { page?: number; limit?: number; search?: string; role?: string; status?: string; sortBy?: string; order?: string }) => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;
  const order = params.order === 'asc' ? 'asc' : 'desc';
  const sortBy = params.sortBy || 'createdAt';

  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.role) where.role = params.role;
  if (params.status === 'banned') where.isBanned = true;
  else if (params.status === 'active') where.isBanned = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, role: true, avatar: true,
        isBanned: true, banReason: true, bannedAt: true, createdAt: true, lastActiveAt: true,
        messId: true,
        mess: { select: { id: true, name: true } },
      },
      skip, take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({ ...u, messName: u.mess?.name, mess: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      mess: { select: { id: true, name: true } },
      meals: { take: 10, orderBy: { date: 'desc' }, select: { date: true, type: true, hasLunch: true, hasDinner: true, guestCount: true } },
      bazaars: { take: 10, orderBy: { date: 'desc' }, select: { date: true, amount: true, description: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);

  const [totalMeals, totalBazaarSpent] = await Promise.all([
    prisma.meal.count({ where: { memberId: userId } }),
    prisma.bazaar.aggregate({ _sum: { amount: true }, where: { buyerId: userId } }),
  ]);

  return {
    ...user,
    stats: {
      totalMealsAllTime: totalMeals,
      totalBazaarSpent: totalBazaarSpent._sum.amount || 0,
    },
  };
};

export const banUser = async (adminId: string, userId: string, reason: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('Cannot ban an admin', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banReason: reason, bannedAt: new Date() },
  });

  await logAdminAction(adminId, 'ban', 'user', userId, { reason });
};

export const unbanUser = async (adminId: string, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null, bannedAt: null },
  });

  await logAdminAction(adminId, 'unban', 'user', userId, {});
};

export const promoteToAdmin = async (adminId: string, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('User is already an admin', 400);

  await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
  await logAdminAction(adminId, 'promote', 'user', userId, { newRole: 'ADMIN' });
};

export const deleteUser = async (adminId: string, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) throw new AppError('Cannot delete the last admin', 400);
  }

  await prisma.user.delete({ where: { id: userId } });
  await logAdminAction(adminId, 'delete', 'user', userId, {});
};

export const getMesses = async (params: { page?: number; limit?: number; search?: string; sortBy?: string; order?: string }) => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;
  const order = params.order === 'asc' ? 'asc' : 'desc';
  const sortBy = params.sortBy || 'createdAt';

  const where: any = {};
  if (params.search) where.name = { contains: params.search, mode: 'insensitive' };

  const [messes, total] = await Promise.all([
    prisma.mess.findMany({
      where,
      select: {
        id: true, name: true, address: true, division: true, district: true, subDistrict: true,
        rentAmount: true, utilityCost: true, createdAt: true,
        managerId: true,
        manager: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true } },
      },
      skip, take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.mess.count({ where }),
  ]);

  const messesWithBazaar = await Promise.all(messes.map(async (m) => {
    const bazaarAgg = await prisma.bazaar.aggregate({
      _sum: { amount: true },
      where: { messId: m.id, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });
    return {
      id: m.id, name: m.name, address: m.address, division: m.division, district: m.district,
      subDistrict: m.subDistrict, rentAmount: m.rentAmount, utilityCost: m.utilityCost,
      createdAt: m.createdAt, manager: m.manager, memberCount: m._count.members,
      totalBazaarThisMonth: bazaarAgg._sum.amount || 0,
    };
  }));

  return { messes: messesWithBazaar, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getMessById = async (messId: string) => {
  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    include: {
      manager: { select: { id: true, name: true, email: true, avatar: true } },
      members: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
    },
  });
  if (!mess) throw new AppError('Mess not found', 404);

  const bills = await prisma.monthlyBill.findMany({
    where: { messId },
    orderBy: { month: 'desc' },
    take: 3,
    select: { id: true, month: true, year: true, totalAmount: true, status: true },
  });

  return { ...mess, bills };
};

export const deleteMess = async (adminId: string, messId: string) => {
  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  if (!mess) throw new AppError('Mess not found', 404);

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({ where: { messId }, data: { messId: null } });
    await tx.meal.deleteMany({ where: { messId } });
    await tx.bazaar.deleteMany({ where: { messId } });
    await tx.monthlyBill.deleteMany({ where: { messId } });
    await tx.deposit.deleteMany({ where: { messId } });
    await tx.joinRequest.deleteMany({ where: { messId } });
    await tx.mess.delete({ where: { id: messId } });
  });

  await logAdminAction(adminId, 'delete', 'mess', messId, { name: mess.name });
};

export const transferMess = async (adminId: string, messId: string, newManagerId: string) => {
  const mess = await prisma.mess.findUnique({ where: { id: messId }, include: { members: true } });
  if (!mess) throw new AppError('Mess not found', 404);

  const newManager = await prisma.user.findUnique({ where: { id: newManagerId } });
  if (!newManager) throw new AppError('New manager not found', 404);
  if (!mess.members.some((m) => m.id === newManagerId)) throw new AppError('User is not a member of this mess', 400);

  const oldManagerId = mess.managerId;
  await prisma.$transaction(async (tx) => {
    await tx.mess.update({ where: { id: messId }, data: { managerId: newManagerId } });
    await tx.user.update({ where: { id: newManagerId }, data: { role: 'MANAGER' } });
    if (oldManagerId !== newManagerId) {
      const managedOtherMesses = await tx.mess.count({ where: { managerId: oldManagerId, id: { not: messId } } });
      if (!managedOtherMesses) {
        await tx.user.update({ where: { id: oldManagerId }, data: { role: 'MEMBER' } });
      }
    }
  });

  await logAdminAction(adminId, 'transfer', 'mess', messId, { from: oldManagerId, to: newManagerId });
};

export const getAnalytics = async (range: string) => {
  let from: Date;
  const to = new Date();
  switch (range) {
    case '7d': from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '1y': from = new Date(to.getFullYear() - 1, to.getMonth(), 1); break;
    case 'all': from = new Date(2020, 0, 1); break;
    default: from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [newUsers, newMesses, totalMeals, bazaarAgg, avgMealRate] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.mess.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.meal.count({ where: { date: { gte: from, lte: to } } }),
    prisma.bazaar.aggregate({ _sum: { amount: true }, where: { date: { gte: from, lte: to } } }),
    prisma.meal.aggregate({ _avg: { guestCount: true }, where: { date: { gte: from, lte: to } } }),
  ]);

  const activeMembers = await prisma.user.count({ where: { messId: { not: null }, lastActiveAt: { gte: from } } });

  const dailyStats: any[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dayStart = new Date(cursor); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor); dayEnd.setHours(23, 59, 59, 999);
    const [users, messes, meals, bazaar] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.mess.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.meal.count({ where: { date: { gte: dayStart, lte: dayEnd } } }),
      prisma.bazaar.aggregate({ _sum: { amount: true }, where: { date: { gte: dayStart, lte: dayEnd } } }),
    ]);
    dailyStats.push({ date: cursor.toISOString().split('T')[0], users, messes, meals, bazaar: bazaar._sum.amount || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const topMesses = await prisma.mess.findMany({
    select: { id: true, name: true, _count: { select: { members: true } } },
    take: 10, orderBy: { createdAt: 'desc' },
  });

  return {
    dateRange: { from: from.toISOString(), to: to.toISOString() },
    summary: { newUsers, newMesses, totalMeals, totalBazaar: bazaarAgg._sum.amount || 0, avgMealRate: avgMealRate._avg.guestCount || 0, activeMembers },
    dailyStats,
    topMesses: topMesses.map((m) => ({ messName: m.name, memberCount: m._count.members })),
  };
};

export const getSettings = async () => {
  let settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: {} });
  }
  return settings;
};

export const updateSettings = async (adminId: string, data: any) => {
  let settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: { ...data, updatedBy: adminId } });
  } else {
    settings = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: { ...data, updatedBy: adminId },
    });
  }
  await logAdminAction(adminId, 'update', 'settings', 'platform', data);
  return settings;
};
