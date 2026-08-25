import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { PERMISSIONS } from '../../utils/permissions';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, requirePermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getDashboard);
