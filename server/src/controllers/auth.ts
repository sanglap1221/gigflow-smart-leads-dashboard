import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { sendTokenResponse } from '../utils/jwt.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists with this email', 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires immediately
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

// @desc    Get all users (for assignment dropdowns)
// @route   GET /api/auth/users
// @access  Private (ADMIN, MANAGER only)
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find({}).select('name email role');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

