import { Router } from 'express';
import * as usersController from './users.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import {
  adminResetPasswordSchema,
  createUserSchema,
  listUsersSchema,
  setActiveSchema,
  updateUserSchema,
} from './users.validators';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  '/',
  requirePermission(PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE),
  validate(listUsersSchema),
  usersController.listUsers,
);
usersRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE),
  usersController.getUser,
);
usersRouter.post(
  '/',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(createUserSchema),
  usersController.createUser,
);
usersRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(updateUserSchema),
  usersController.updateUser,
);
usersRouter.patch(
  '/:id/active',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(setActiveSchema),
  usersController.setUserActive,
);
usersRouter.post(
  '/:id/reset-password',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(adminResetPasswordSchema),
  usersController.adminResetPassword,
);
