import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().default(0),
});

const paymentSchema = z.object({
  method: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE']),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    clientId: z.string().uuid(),
    seriesId: z.string().uuid().optional(),
    items: z.array(itemSchema).min(1, 'Debe agregar al menos un producto'),
    discount: z.number().nonnegative().default(0),
    notes: z.string().optional(),
    paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO', 'COMBINADO']),
    payments: z.array(paymentSchema).default([]),
    creditDueDate: z.string().optional(),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    clientId: z.string().uuid().optional(),
    fullNumber: z.string().optional(),
    userId: z.string().uuid().optional(),
    status: z.enum(['EMITIDA', 'PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA']).optional(),
    paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO', 'COMBINADO']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const cancelInvoiceSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().min(5, 'El motivo de anulacion es requerido'),
  }),
});
