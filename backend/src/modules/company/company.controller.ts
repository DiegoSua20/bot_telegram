import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import { ApiError } from '../../utils/ApiError';
import * as companyService from './company.service';

export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await companyService.getConfig();
  res.json(config);
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const before = await companyService.getConfig();
  const config = await companyService.updateConfig(req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE',
    module: 'company',
    recordId: config.id,
    oldData: before,
    newData: config,
  });
  res.json(config);
});

export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No se proporciono ningun archivo');
  }
  const logoUrl = `/uploads/${req.file.filename}`;
  const config = await companyService.updateLogo(logoUrl);
  await writeAudit({ userId: req.user!.id, action: 'UPDATE_LOGO', module: 'company', recordId: config.id });
  res.json(config);
});
