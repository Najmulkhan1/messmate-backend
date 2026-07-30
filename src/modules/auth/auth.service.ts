import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { generateTokens } from '../../utils/jwt';

export const updateProfile = async (userId: string, data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;

  if (data.newPassword) {
    if (!data.currentPassword) throw new AppError('Current password is required to set a new password', 400);
    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    updateData.password = await bcrypt.hash(data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return updated;
};

export const registerUser = async (data: any) => {
  const { name, email, password, phone } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'MEMBER';

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    },
  });

  const { accessToken, refreshToken } = generateTokens(user);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (data: any) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user);

  return { user, accessToken, refreshToken };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      mess: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
