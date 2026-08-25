import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';
import * as cashService from '../cash/cash.service';

function computeDisplayStatus(balance: number, dueDate: Date, storedStatus: string) {
  if (balance <= 0.009) return 'PAGADO';
  if (new Date(dueDate) < new Date()) return 'VENCIDO';
  return storedStatus === 'PENDIENTE' ? 'PENDIENTE' : 'PARCIAL';
}

interface ListParams {
  clientId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

export async function listCreditAccounts(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.CreditAccountWhereInput = {
    ...(params.clientId ? { clientId: params.clientId } : {}),
  };

  const [rawItems, total] = await Promise.all([
    prisma.creditAccount.findMany({
      where,
      skip,
      take,
      orderBy: { dueDate: 'asc' },
      include: {
        client: { select: { id: true, name: true, code: true } },
        invoice: { select: { id: true, fullNumber: true, createdAt: true } },
      },
    }),
    prisma.creditAccount.count({ where }),
  ]);

  let items = rawItems.map((item) => ({
    ...item,
    displayStatus: computeDisplayStatus(Number(item.balance), item.dueDate, item.status),
  }));

  if (params.status) {
    items = items.filter((item) => item.displayStatus === params.status);
  }

  return buildPaginationResult(items, params.status ? items.length : total, page, pageSize);
}

export async function getCreditAccount(id: string) {
  const account = await prisma.creditAccount.findUnique({
    where: { id },
    include: {
      client: true,
      invoice: { include: { details: { include: { product: true } } } },
      payments: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!account) throw ApiError.notFound('Cuenta por cobrar no encontrada');
  return { ...account, displayStatus: computeDisplayStatus(Number(account.balance), account.dueDate, account.status) };
}

export async function registerPayment(
  creditAccountId: string,
  amount: number,
  method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE',
  reference: string | undefined,
  userId: string,
) {
  const account = await prisma.creditAccount.findUnique({ where: { id: creditAccountId }, include: { invoice: true } });
  if (!account) throw ApiError.notFound('Cuenta por cobrar no encontrada');
  if (Number(account.balance) <= 0) throw ApiError.badRequest('Esta cuenta ya esta pagada en su totalidad');
  if (amount > Number(account.balance) + 0.01) {
    throw ApiError.badRequest(`El abono (${amount}) no puede ser mayor al saldo pendiente (${account.balance})`);
  }

  const openSession = await cashService.findOpenSessionForUser(userId);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.creditPayment.create({
      data: { creditAccountId, amount, method, reference, userId },
    });

    const newPaid = Number(account.paidAmount) + amount;
    const newBalance = Math.max(0, Number(account.totalAmount) - newPaid);
    const newStatus = newBalance <= 0.009 ? 'PAGADO' : 'PARCIAL';

    const updatedAccount = await tx.creditAccount.update({
      where: { id: creditAccountId },
      data: { paidAmount: newPaid, balance: newBalance, status: newStatus },
    });

    await tx.invoice.update({
      where: { id: account.invoiceId },
      data: { status: newStatus === 'PAGADO' ? 'PAGADA' : 'PARCIAL' },
    });

    if (openSession) {
      await cashService.recordCreditPaymentCashMovement(
        tx,
        openSession.id,
        method,
        amount,
        account.invoice.fullNumber,
      );
    }

    return { payment, account: updatedAccount };
  });
}
