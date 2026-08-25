import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    permissionIds: z.array(z.string().uuid()).default([]),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const updatePermissionsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    permissionIds: z.array(z.string().uuid()),
  }),
});
