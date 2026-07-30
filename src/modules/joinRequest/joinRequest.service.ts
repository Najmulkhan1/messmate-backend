import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const sendRequest = async (requesterId: string, messId: string) => {
  const user = await prisma.user.findUnique({ where: { id: requesterId } });

  if (user?.messId) {
    throw new AppError('You are already part of a mess', 400);
  }

  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  if (!mess) {
    throw new AppError('Mess not found', 404);
  }

  const existing = await prisma.joinRequest.findFirst({
    where: { requesterId, messId, status: 'PENDING' },
  });

  if (existing) {
    throw new AppError('You already have a pending request to this mess', 400);
  }

  const request = await prisma.joinRequest.create({
    data: { requesterId, messId },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      mess: { select: { id: true, name: true } },
    },
  });

  const requesterName = user?.name || 'Someone';
  await prisma.notification.create({
    data: {
      userId: mess.managerId,
      title: 'New Join Request',
      message: `${requesterName} wants to join your mess "${mess.name}"`,
    },
  });

  return request;
};

export const getPendingRequests = async (managerId: string) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });

  if (!manager || !manager.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can view requests', 403);
  }

  const requests = await prisma.joinRequest.findMany({
    where: { messId: manager.messId, status: 'PENDING' },
    include: {
      requester: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
};

export const acceptRequest = async (managerId: string, requestId: string) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can accept requests', 403);
  }

  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { requester: true, mess: true },
  });

  if (!request || request.messId !== manager.messId) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'PENDING') {
    throw new AppError('This request has already been handled', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.joinRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    await tx.user.update({
      where: { id: request.requesterId },
      data: { messId: manager.messId, role: 'MEMBER' },
    });

    await tx.notification.create({
      data: {
        userId: request.requesterId,
        title: 'Request Accepted',
        message: `Your request to join "${request.mess.name}" has been accepted!`,
      },
    });
  });

  return null;
};

export const rejectRequest = async (managerId: string, requestId: string) => {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });

  if (!manager?.messId || manager.role !== 'MANAGER') {
    throw new AppError('Only mess managers can reject requests', 403);
  }

  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { mess: true },
  });

  if (!request || request.messId !== manager.messId) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'PENDING') {
    throw new AppError('This request has already been handled', 400);
  }

  await prisma.joinRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' },
  });

  return null;
};
