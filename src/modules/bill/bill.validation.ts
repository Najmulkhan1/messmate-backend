import { z } from 'zod';

export const generateBillSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020),
  }),
});
