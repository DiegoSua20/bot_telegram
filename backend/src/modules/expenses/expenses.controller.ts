import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as expensesService from './expenses.service';

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  res.json(await expensesService.listExpenses(req.query as Record<string, string>));
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expensesService.createExpense({ ...req.body, userId: req.user!.id });
  await writeAudit({
    userId: req.user!.id,
    action: 'CREATE',
    module: 'expenses',
    recordId: expense.id,
    newData: expense,
  });
  res.status(201).json(expense);
});
