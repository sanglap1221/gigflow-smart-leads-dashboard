import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Lead name is required')
      .min(2, 'Lead name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Lead email is required')
      .email('Please provide a valid email address'),
    phone: z.string().trim().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON']).optional(),
    source: z
      .enum(['Web', 'Referral', 'Cold Call', 'Social Media', 'Other'])
      .optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format')
      .optional(),
    notes: z.string().trim().optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Lead name must be at least 2 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .optional(),
    phone: z.string().trim().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON']).optional(),
    source: z
      .enum(['Web', 'Referral', 'Cold Call', 'Social Media', 'Other'])
      .optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format')
      .optional(),
    notes: z.string().trim().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lead ID format'),
  }),
});

export const leadIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lead ID format'),
  }),
});
