import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as auditService from './audit.service';

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  res.json(await auditService.listAuditLogs(req.query as Record<string, string>));
});
