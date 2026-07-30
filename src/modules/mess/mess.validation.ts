import { z } from 'zod';

export const createMessSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Mess name must be at least 3 characters'),
    address: z.string().optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    subDistrict: z.string().optional(),
    rentAmount: z.number().min(0, 'Rent amount cannot be negative').optional(),
    utilityCost: z.number().min(0, 'Utility cost cannot be negative').optional(),
  }),
});

export const updateMessSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    address: z.string().optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    subDistrict: z.string().optional(),
    rentAmount: z.number().min(0).optional(),
    utilityCost: z.number().min(0).optional(),
  }),
});
