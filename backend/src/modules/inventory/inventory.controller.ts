import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as inventoryService from './inventory.service';

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  res.json(await inventoryService.listMovements(req.query as Record<string, string>));
});

export const getKardex = asyncHandler(async (req: Request, res: Response) => {
  res.json(await inventoryService.getKardex(req.params.productId));
});

export const registerMovement = asyncHandler(async (req: Request, res: Response) => {
  const movement = await inventoryService.registerMovement({ ...req.body, userId: req.user!.id });
  await writeAudit({
    userId: req.user!.id,
    action: `INVENTORY_${req.body.type}`,
    module: 'inventory',
    recordId: movement.id,
    newData: movement,
  });
  res.status(201).json(movement);
});
