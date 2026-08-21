import { z } from 'zod';

const productBody = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(['PRODUCTO', 'SERVICIO']).default('PRODUCTO'),
  salePrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(12),
  trackInventory: z.boolean().default(true),
  stock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  unit: z.string().min(1).default('UNIDAD'),
  active: z.boolean().optional(),
});

export const createProductSchema = z.object({ body: productBody });

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: productBody.partial(),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ active: z.boolean() }),
});

export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['PRODUCTO', 'SERVICIO']).optional(),
    active: z.enum(['true', 'false']).optional(),
    lowStock: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
