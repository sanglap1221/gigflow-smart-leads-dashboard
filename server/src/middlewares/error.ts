import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: { message: string; stack?: string } = {
    message,
  };

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map((val: any) => val.message),
    });
    return;
  }

  // Handle Mongoose duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0] || 'field';
    res.status(400).json({
      message: `Duplicate value entered for ${field}`,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Invalid token. Please log in again.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Your token has expired. Please log in again.',
    });
    return;
  }

  res.status(statusCode).json(response);
};
