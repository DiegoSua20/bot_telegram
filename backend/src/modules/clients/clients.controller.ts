import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as clientsService from './clients.service';

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  res.json(await clientsService.listClients(req.query as Record<string, string>));
});

export const searchClients = asyncHandler(async (req: Request, res: Response) => {
  res.json(await clientsService.searchClients(String(req.query.q ?? '')));
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  res.json(await clientsService.getClient(req.params.id));
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.createClient(req.body);
  await writeAudit({ userId: req.user!.id, action: 'CREATE', module: 'clients', recordId: client.id, newData: client });
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const before = await clientsService.getClient(req.params.id);
  const client = await clientsService.updateClient(req.params.id, req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE',
    module: 'clients',
    recordId: client.id,
    oldData: before,
    newData: client,
  });
  res.json(client);
});

export const setClientActive = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.setClientActive(req.params.id, req.body.active);
  await writeAudit({
    userId: req.user!.id,
    action: req.body.active ? 'ACTIVATE' : 'DEACTIVATE',
    module: 'clients',
    recordId: client.id,
  });
  res.json(client);
});
