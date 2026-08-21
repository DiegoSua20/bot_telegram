import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(2),
    taxId: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    contact: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(2).optional(),
    taxId: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    contact: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ active: z.boolean() }),
});

export const listClientsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    active: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
