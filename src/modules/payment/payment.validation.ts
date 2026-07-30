import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const payBillSchema = z.object({
  body: z.object({
    method: z.nativeEnum(PaymentMethod),
    transactionId: z.string().min(1, 'Transaction ID is required').optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    status: z.enum([PaymentStatus.COMPLETED, PaymentStatus.FAILED]),
  }),
});
