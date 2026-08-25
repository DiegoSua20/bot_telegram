import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as dashboardService from './dashboard.service';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await dashboardService.getDashboardData());
});
