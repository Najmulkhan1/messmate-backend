import { z } from 'zod';

export const sendRequestSchema = z.object({
  body: z.object({
    messId: z.string().uuid('Invalid mess ID'),
  }),
});

export const handleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid request ID'),
  }),
});
