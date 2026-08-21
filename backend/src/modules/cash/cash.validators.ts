import { z } from 'zod';

export const openSessionSchema = z.object({
  body: z.object({
    openingAmount: z.number().nonnegative(),
    notes: z.string().optional(),
  }),
});

export const closeSessionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    declaredAmount: z.number().nonnegative(),
    notes: z.string().optional(),
  }),
});

export const manualMovementSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.enum(['INGRESO', 'EGRESO']),
    amount: z.number().positive(),
    description: z.string().min(1),
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    status: z.enum(['ABIERTA', 'CERRADA']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
