import { Router } from 'express';
import * as expensesController from './expenses.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createExpenseSchema, listExpensesSchema } from './expenses.validators';

export const expensesRouter = Router();

expensesRouter.use(requireAuth, requirePermission(PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_MANAGE));

expensesRouter.get('/', validate(listExpensesSchema), expensesController.listExpenses);
expensesRouter.post(
  '/',
  requirePermission(PERMISSIONS.EXPENSES_MANAGE),
  validate(createExpenseSchema),
  expensesController.createExpense,
);
