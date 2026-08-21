import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    roleId: z.string().uuid(),
    active: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    roleId: z.string().uuid().optional(),
  }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ active: z.boolean() }),
});

export const adminResetPasswordSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ password: z.string().min(6) }),
});

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    roleId: z.string().uuid().optional(),
    active: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
