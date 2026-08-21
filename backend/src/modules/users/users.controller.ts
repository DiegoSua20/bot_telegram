import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as usersService from './users.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.listUsers(req.query as Record<string, string>);
  res.json(result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUser(req.params.id);
  res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'CREATE',
    module: 'users',
    recordId: user.id,
    newData: user,
  });
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const before = await usersService.getUser(req.params.id);
  const user = await usersService.updateUser(req.params.id, req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE',
    module: 'users',
    recordId: user.id,
    oldData: before,
    newData: user,
  });
  res.json(user);
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const before = await usersService.getUser(req.params.id);
  const user = await usersService.setUserActive(req.params.id, req.body.active);
  await writeAudit({
    userId: req.user!.id,
    action: req.body.active ? 'ACTIVATE' : 'DEACTIVATE',
    module: 'users',
    recordId: user.id,
    oldData: before,
    newData: user,
  });
  res.json(user);
});

export const adminResetPassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.adminResetPassword(req.params.id, req.body.password);
  await writeAudit({
    userId: req.user!.id,
    action: 'ADMIN_RESET_PASSWORD',
    module: 'users',
    recordId: req.params.id,
  });
  res.json({ message: 'Contrasena reiniciada correctamente' });
});
