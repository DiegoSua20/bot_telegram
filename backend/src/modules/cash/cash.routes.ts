import { Router } from 'express';
import * as cashController from './cash.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { closeSessionSchema, listSessionsSchema, manualMovementSchema, openSessionSchema } from './cash.validators';

export const cashRouter = Router();

cashRouter.use(requireAuth, requirePermission(PERMISSIONS.CASH_VIEW, PERMISSIONS.CASH_MANAGE));

cashRouter.get('/', validate(listSessionsSchema), cashController.listSessions);
cashRouter.get('/current', cashController.getCurrentSession);
cashRouter.get('/:id/summary', cashController.getSessionSummary);
cashRouter.post(
  '/open',
  requirePermission(PERMISSIONS.CASH_MANAGE),
  validate(openSessionSchema),
  cashController.openSession,
);
cashRouter.post(
  '/:id/close',
  requirePermission(PERMISSIONS.CASH_MANAGE),
  validate(closeSessionSchema),
  cashController.closeSession,
);
cashRouter.post(
  '/:id/movements',
  requirePermission(PERMISSIONS.CASH_MANAGE),
  validate(manualMovementSchema),
  cashController.registerManualMovement,
);
