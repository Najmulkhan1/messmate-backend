import { z } from 'zod';

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid user email to add'),
  }),
});
