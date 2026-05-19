import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config/index.js';

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '7d',
  });
};

export const sendTokenResponse = (
  user: { _id: any; name: string; email: string; role: string },
  statusCode: number,
  res: Response
): void => {
  const token = generateToken(user._id.toString());

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? ('none' as const) : ('lax' as const),
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token, // return token too for optional header storage, though cookie is primary
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};
