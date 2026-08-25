import { Router } from 'express';
import * as clientsController from './clients.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createClientSchema, listClientsSchema, setActiveSchema, updateClientSchema } from './clients.validators';

export const clientsRouter = Router();

clientsRouter.use(requireAuth, requirePermission(PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE));

clientsRouter.get('/', validate(listClientsSchema), clientsController.listClients);
clientsRouter.get('/search', clientsController.searchClients);
clientsRouter.get('/:id', clientsController.getClient);
clientsRouter.post(
  '/',
  requirePermission(PERMISSIONS.CLIENTS_MANAGE),
  validate(createClientSchema),
  clientsController.createClient,
);
clientsRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.CLIENTS_MANAGE),
  validate(updateClientSchema),
  clientsController.updateClient,
);
clientsRouter.patch(
  '/:id/active',
  requirePermission(PERMISSIONS.CLIENTS_MANAGE),
  validate(setActiveSchema),
  clientsController.setClientActive,
);
