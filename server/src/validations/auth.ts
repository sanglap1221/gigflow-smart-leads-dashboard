import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  }),
});
