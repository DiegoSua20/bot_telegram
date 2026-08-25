import { z } from 'zod';

export const listAuditSchema = z.object({
  query: z.object({
    module: z.string().optional(),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
