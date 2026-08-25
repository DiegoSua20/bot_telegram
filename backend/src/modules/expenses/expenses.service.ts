import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { getPagination, buildPaginationResult } from '../../utils/pagination';
import * as cashService from '../cash/cash.service';

interface ListParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  userId?: string;
  page?: string;
  pageSize?: string;
}

export async function listExpenses(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.ExpenseWhereInput = {
    ...(params.dateFrom || params.dateTo
      ? {
          date: {
            ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(params.category ? { category: { contains: params.category, mode: 'insensitive' } } : {}),
    ...(params.userId ? { userId: params.userId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.expense.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

interface CreateExpenseInput {
  date?: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  referenceDoc?: string;
  userId: string;
}

export async function createExpense(input: CreateExpenseInput) {
  const openSession = input.paymentMethod === 'EFECTIVO' ? await cashService.findOpenSessionForUser(input.userId) : null;

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        date: input.date ? new Date(input.date) : new Date(),
        category: input.category,
        description: input.description,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        referenceDoc: input.referenceDoc,
        userId: input.userId,
      },
    });

    if (openSession) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: openSession.id,
          type: 'GASTO',
          amount: input.amount,
          description: `Gasto - ${input.category}: ${input.description}`,
          reference: expense.id,
        },
      });
    }

    return expense;
  });
}
