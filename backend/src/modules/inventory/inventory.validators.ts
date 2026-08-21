import { z } from 'zod';

export const registerMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
    quantity: z.number(),
    reason: z.string().min(3, 'El motivo es requerido'),
    reference: z.string().optional(),
  }),
});

export const listMovementsSchema = z.object({
  query: z.object({
    productId: z.string().uuid().optional(),
    type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
