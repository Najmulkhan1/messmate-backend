import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const generateTokens = (user: User) => {
  const payload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'super-secret-jwt-key-min-32-chars',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-min-32-chars',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};
