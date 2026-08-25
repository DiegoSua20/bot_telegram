import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as rolesService from './roles.service';

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await rolesService.listRoles();
  res.json(roles);
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await rolesService.listPermissions();
  res.json(permissions);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.createRole(req.body.name, req.body.description, req.body.permissionIds);
  await writeAudit({ userId: req.user!.id, action: 'CREATE', module: 'roles', recordId: role.id, newData: role });
  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.updateRole(req.params.id, req.body);
  await writeAudit({ userId: req.user!.id, action: 'UPDATE', module: 'roles', recordId: role.id, newData: role });
  res.json(role);
});

export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.updateRolePermissions(req.params.id, req.body.permissionIds);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE_PERMISSIONS',
    module: 'roles',
    recordId: req.params.id,
    newData: role,
  });
  res.json(role);
});
