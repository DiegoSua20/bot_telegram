import { Router } from 'express';
import * as creditController from './credit.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { listCreditSchema, registerPaymentSchema } from './credit.validators';

export const creditRouter = Router();

creditRouter.use(requireAuth, requirePermission(PERMISSIONS.CREDIT_VIEW, PERMISSIONS.CREDIT_MANAGE));

creditRouter.get('/', validate(listCreditSchema), creditController.listCreditAccounts);
creditRouter.get('/:id', creditController.getCreditAccount);
creditRouter.post(
  '/:id/payments',
  requirePermission(PERMISSIONS.CREDIT_MANAGE),
  validate(registerPaymentSchema),
  creditController.registerPayment,
);
