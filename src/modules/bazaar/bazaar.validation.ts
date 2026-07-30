import { z } from 'zod';

export const addBazaarSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    items: z.string().min(2, 'Items description is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    description: z.string().optional(),
  }),
});

export const updateBazaarSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    items: z.string().min(2).optional(),
    amount: z.number().min(0).optional(),
    description: z.string().optional(),
  }),
});
