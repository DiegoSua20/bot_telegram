import { z } from 'zod';

export const createSeriesSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(10),
  }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ active: z.boolean() }),
});
