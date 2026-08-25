import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as reportsService from './reports.service';
import { exportToExcel, exportToPdf } from './reports.exporters';

export const listReportTypes = asyncHandler(async (_req: Request, res: Response) => {
  res.json(reportsService.REPORT_TYPES);
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getReport(req.params.type, req.query as Record<string, string>);
  res.json(report);
});

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const format = String(req.query.format ?? 'xlsx');
  const report = await reportsService.getReport(req.params.type, req.query as Record<string, string>);

  if (format === 'xlsx') {
    const buffer = await exportToExcel(report);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}.xlsx"`);
    res.send(buffer);
    return;
  }
  if (format === 'pdf') {
    const buffer = await exportToPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}.pdf"`);
    res.send(buffer);
    return;
  }
  throw ApiError.badRequest('Formato no soportado. Use xlsx o pdf');
});
