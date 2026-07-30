import { z } from 'zod';

export const addMealSchema = z.object({
  body: z.object({
    date: z.string().datetime({ message: 'Must be a valid ISO date string' }),
    type: z.enum(['LUNCH', 'DINNER']),
    status: z.boolean().optional(),
    guestCount: z.number().min(0).optional(),
    memberId: z.string().uuid('Invalid member ID'),
  }),
});
