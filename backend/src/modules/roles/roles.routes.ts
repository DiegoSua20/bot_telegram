import { Router } from 'express';
import * as rolesController from './roles.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createRoleSchema, updatePermissionsSchema, updateRoleSchema } from './roles.validators';

export const rolesRouter = Router();

rolesRouter.use(requireAuth);

rolesRouter.get('/', requirePermission(PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_MANAGE), rolesController.listRoles);
rolesRouter.get(
  '/permissions',
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  rolesController.listPermissions,
);
rolesRouter.post(
  '/',
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  validate(createRoleSchema),
  rolesController.createRole,
);
rolesRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  validate(updateRoleSchema),
  rolesController.updateRole,
);
rolesRouter.put(
  '/:id/permissions',
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  validate(updatePermissionsSchema),
  rolesController.updatePermissions,
);
