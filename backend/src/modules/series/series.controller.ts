import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as seriesService from './series.service';

export const listSeries = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await seriesService.listSeries());
});

export const createSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await seriesService.createSeries(req.body.name);
  await writeAudit({ userId: req.user!.id, action: 'CREATE', module: 'series', recordId: series.id, newData: series });
  res.status(201).json(series);
});

export const setActive = asyncHandler(async (req: Request, res: Response) => {
  const series = await seriesService.setSeriesActive(req.params.id, req.body.active);
  await writeAudit({
    userId: req.user!.id,
    action: req.body.active ? 'ACTIVATE' : 'DEACTIVATE',
    module: 'series',
    recordId: series.id,
  });
  res.json(series);
});
