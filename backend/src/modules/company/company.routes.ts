import { Router } from 'express';
import * as companyController from './company.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { updateConfigSchema } from './company.validators';
import { uploadLogo } from '../../utils/upload';

export const companyRouter = Router();

companyRouter.use(requireAuth);

companyRouter.get('/', companyController.getConfig);
companyRouter.put(
  '/',
  requirePermission(PERMISSIONS.COMPANY_MANAGE),
  validate(updateConfigSchema),
  companyController.updateConfig,
);
companyRouter.post(
  '/logo',
  requirePermission(PERMISSIONS.COMPANY_MANAGE),
  uploadLogo.single('logo'),
  companyController.uploadLogo,
);
