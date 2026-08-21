import { prisma } from '../config/prisma';

interface AuditParams {
  userId?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ip?: string | null;
}

export async function writeAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      module: params.module,
      recordId: params.recordId ?? null,
      oldData: params.oldData === undefined ? undefined : JSON.parse(JSON.stringify(params.oldData)),
      newData: params.newData === undefined ? undefined : JSON.parse(JSON.stringify(params.newData)),
      ip: params.ip ?? null,
    },
  });
}
