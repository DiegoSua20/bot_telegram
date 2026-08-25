import { CashMovementType, PaymentMethod } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { Tx } from '../../utils/prismaTx';

const SALE_TYPE_BY_METHOD: Record<string, CashMovementType> = {
  EFECTIVO: 'VENTA_EFECTIVO',
  TARJETA: 'VENTA_TARJETA',
  TRANSFERENCIA: 'VENTA_TRANSFERENCIA',
  CHEQUE: 'VENTA_CHEQUE',
};

export async function findOpenSessionForUser(userId: string) {
  return prisma.cashSession.findFirst({ where: { userId, status: 'ABIERTA' } });
}

export async function recordSaleCashMovements(
  tx: Tx,
  cashSessionId: string,
  payments: { method: PaymentMethod; amount: number }[],
  reference: string,
) {
  for (const payment of payments) {
    const type = SALE_TYPE_BY_METHOD[payment.method] ?? 'VENTA_OTRO';
    await tx.cashMovement.create({
      data: {
        cashSessionId,
        type,
        amount: payment.amount,
        description: `Venta - Factura ${reference}`,
        reference,
      },
    });
  }
}

export async function reverseSaleCashMovements(
  tx: Tx,
  cashSessionId: string,
  payments: { method: PaymentMethod; amount: number }[],
  reference: string,
) {
  for (const payment of payments) {
    const type = SALE_TYPE_BY_METHOD[payment.method] ?? 'VENTA_OTRO';
    await tx.cashMovement.create({
      data: {
        cashSessionId,
        type,
        amount: -payment.amount,
        description: `Reverso por anulacion de factura ${reference}`,
        reference,
      },
    });
  }
}

export async function recordCreditPaymentCashMovement(
  tx: Tx,
  cashSessionId: string,
  method: PaymentMethod,
  amount: number,
  reference: string,
) {
  const type = SALE_TYPE_BY_METHOD[method] ?? 'VENTA_OTRO';
  await tx.cashMovement.create({
    data: { cashSessionId, type, amount, description: `Abono - ${reference}`, reference },
  });
}

function summarizeMovements(movements: { type: CashMovementType; amount: unknown }[]) {
  const totals: Record<string, number> = {
    VENTA_EFECTIVO: 0,
    VENTA_TARJETA: 0,
    VENTA_TRANSFERENCIA: 0,
    VENTA_CHEQUE: 0,
    VENTA_OTRO: 0,
    INGRESO: 0,
    EGRESO: 0,
    GASTO: 0,
  };
  for (const m of movements) {
    totals[m.type] = (totals[m.type] ?? 0) + Number(m.amount);
  }
  return totals;
}

export async function getSessionSummary(cashSessionId: string) {
  const session = await prisma.cashSession.findUnique({
    where: { id: cashSessionId },
    include: { movements: { orderBy: { createdAt: 'asc' } }, user: { select: { id: true, name: true } } },
  });
  if (!session) throw ApiError.notFound('Sesion de caja no encontrada');

  const totals = summarizeMovements(session.movements);
  const expectedCash =
    Number(session.openingAmount) + totals.VENTA_EFECTIVO + totals.INGRESO - totals.EGRESO - totals.GASTO;

  return { session, totals, expectedCash };
}

export async function listSessions(params: { userId?: string; status?: string; page?: string; pageSize?: string }) {
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? 20) || 20));
  const where = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.status ? { status: params.status as 'ABIERTA' | 'CERRADA' } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.cashSession.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { openedAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.cashSession.count({ where }),
  ]);
  return { items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function openSession(userId: string, openingAmount: number, notes?: string) {
  const existing = await findOpenSessionForUser(userId);
  if (existing) {
    throw ApiError.conflict('Ya existe una caja abierta para este usuario');
  }
  return prisma.cashSession.create({ data: { userId, openingAmount, notes } });
}

export interface DenominationCount {
  denomination: number;
  quantity: number;
}

export async function closeSession(
  cashSessionId: string,
  breakdown: DenominationCount[],
  notes?: string,
) {
  const { session, expectedCash } = await getSessionSummary(cashSessionId);
  if (session.status === 'CERRADA') {
    throw ApiError.conflict('Esta caja ya fue cerrada');
  }

  const cleanBreakdown = breakdown
    .filter((row) => row.quantity > 0)
    .map((row) => ({
      denomination: row.denomination,
      quantity: row.quantity,
      subtotal: Math.round(row.denomination * row.quantity * 100) / 100,
    }));
  const declaredAmount = Math.round(cleanBreakdown.reduce((acc, row) => acc + row.subtotal, 0) * 100) / 100;
  const difference = Math.round((declaredAmount - expectedCash) * 100) / 100;

  return prisma.cashSession.update({
    where: { id: cashSessionId },
    data: {
      status: 'CERRADA',
      closedAt: new Date(),
      expectedAmount: expectedCash,
      declaredAmount,
      declaredBreakdown: cleanBreakdown,
      difference,
      notes,
    },
  });
}

export async function getSession(id: string) {
  const session = await prisma.cashSession.findUnique({ where: { id } });
  if (!session) throw ApiError.notFound('Sesion de caja no encontrada');
  return session;
}

export async function registerManualMovement(
  cashSessionId: string,
  type: 'INGRESO' | 'EGRESO',
  amount: number,
  description: string,
) {
  const session = await getSession(cashSessionId);
  if (session.status === 'CERRADA') throw ApiError.badRequest('La caja ya esta cerrada');
  return prisma.cashMovement.create({ data: { cashSessionId, type, amount, description } });
}
