import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { getPagination, buildPaginationResult } from '../../utils/pagination';

interface ListParams {
  module?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  pageSize?: string;
}

export async function listAuditLogs(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.AuditLogWhereInput = {
    ...(params.module ? { module: params.module } : {}),
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.action ? { action: params.action } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          createdAt: {
            ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}
