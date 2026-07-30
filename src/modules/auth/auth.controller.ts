import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as authService from './auth.service';
import jwt from 'jsonwebtoken';

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  
  setCookies(res, accessToken, refreshToken);

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
      accessToken,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  setCookies(res, accessToken, refreshToken);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        messId: user.messId,
      },
      accessToken,
    },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // Will be set by auth middleware
  
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await authService.getUserById(userId);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        mess: user.mess,
      },
    },
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const user = await authService.updateProfile(userId, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        messId: user.messId,
      },
    },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-min-32-chars'
    ) as { userId: string; role: string };

    const payload = {
      userId: decoded.userId,
      role: decoded.role,
    };

    const newAccessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super-secret-jwt-key-min-32-chars',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});
