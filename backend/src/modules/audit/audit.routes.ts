import { Router } from 'express';
import * as auditController from './audit.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { listAuditSchema } from './audit.validators';

export const auditRouter = Router();

auditRouter.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  validate(listAuditSchema),
  auditController.listAuditLogs,
);
