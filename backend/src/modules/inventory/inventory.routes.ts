import { Router } from 'express';
import * as inventoryController from './inventory.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { listMovementsSchema, registerMovementSchema } from './inventory.validators';

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth, requirePermission(PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE));

inventoryRouter.get('/movements', validate(listMovementsSchema), inventoryController.listMovements);
inventoryRouter.get('/kardex/:productId', inventoryController.getKardex);
inventoryRouter.post(
  '/movements',
  requirePermission(PERMISSIONS.INVENTORY_MANAGE),
  validate(registerMovementSchema),
  inventoryController.registerMovement,
);
