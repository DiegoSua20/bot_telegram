import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as cashService from './cash.service';

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  res.json(await cashService.listSessions(req.query as Record<string, string>));
});

export const getCurrentSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await cashService.findOpenSessionForUser(req.user!.id);
  res.json(session);
});

export const getSessionSummary = asyncHandler(async (req: Request, res: Response) => {
  res.json(await cashService.getSessionSummary(req.params.id));
});

export const openSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await cashService.openSession(req.user!.id, req.body.openingAmount, req.body.notes);
  await writeAudit({ userId: req.user!.id, action: 'OPEN', module: 'cash', recordId: session.id, newData: session });
  res.status(201).json(session);
});

export const closeSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await cashService.closeSession(req.params.id, req.body.declaredAmount, req.body.notes);
  await writeAudit({ userId: req.user!.id, action: 'CLOSE', module: 'cash', recordId: session.id, newData: session });
  res.json(session);
});

export const registerManualMovement = asyncHandler(async (req: Request, res: Response) => {
  const movement = await cashService.registerManualMovement(
    req.params.id,
    req.body.type,
    req.body.amount,
    req.body.description,
  );
  await writeAudit({
    userId: req.user!.id,
    action: `CASH_${req.body.type}`,
    module: 'cash',
    recordId: movement.id,
    newData: movement,
  });
  res.status(201).json(movement);
});
