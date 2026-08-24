import { Router } from 'express';
import * as reportsController from './reports.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { PERMISSIONS } from '../../utils/permissions';

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requirePermission(PERMISSIONS.REPORTS_VIEW));

reportsRouter.get('/', reportsController.listReportTypes);
reportsRouter.get('/:type', reportsController.getReport);
reportsRouter.get('/:type/export', reportsController.exportReport);
