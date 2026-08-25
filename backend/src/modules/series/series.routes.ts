import { Router } from 'express';
import * as seriesController from './series.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createSeriesSchema, setActiveSchema } from './series.validators';

export const seriesRouter = Router();

seriesRouter.use(requireAuth);

seriesRouter.get('/', seriesController.listSeries);
seriesRouter.post(
  '/',
  requirePermission(PERMISSIONS.SERIES_MANAGE),
  validate(createSeriesSchema),
  seriesController.createSeries,
);
seriesRouter.patch(
  '/:id/active',
  requirePermission(PERMISSIONS.SERIES_MANAGE),
  validate(setActiveSchema),
  seriesController.setActive,
);
