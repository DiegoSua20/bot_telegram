import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    category: z.string().min(2),
    description: z.string().min(2),
    amount: z.number().positive(),
    paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE']),
    referenceDoc: z.string().optional(),
  }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().uuid().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
