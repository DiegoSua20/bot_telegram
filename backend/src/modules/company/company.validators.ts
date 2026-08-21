import { z } from 'zod';

export const updateConfigSchema = z.object({
  body: z.object({
    tradeName: z.string().min(1).optional(),
    legalName: z.string().min(1).optional(),
    taxId: z.string().min(1).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    currency: z.string().min(1).optional(),
    currencySymbol: z.string().min(1).max(5).optional(),
    defaultTaxRate: z.number().min(0).max(100).optional(),
    country: z.string().min(1).optional(),
    invoiceFormat: z.enum(['A4', 'CARTA', 'THERMAL']).optional(),
    allowOversell: z.boolean().optional(),
  }),
});
