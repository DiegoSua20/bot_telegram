import { z } from 'zod';

export const listCreditSchema = z.object({
  query: z.object({
    clientId: z.string().uuid().optional(),
    status: z.enum(['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const registerPaymentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    amount: z.number().positive(),
    method: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE']),
    reference: z.string().optional(),
  }),
});
