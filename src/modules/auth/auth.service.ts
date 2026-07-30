import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { generateTokens } from '../../utils/jwt';

export const registerUser = async (data: any) => {
  const { name, email, password, phone } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
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
