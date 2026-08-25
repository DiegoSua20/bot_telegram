import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildInvoicePdfBuffer } from './invoice-pdf.service';

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const format = String(req.query.format ?? '').toUpperCase() === 'THERMAL' ? 'THERMAL' : 'A4';
  const buffer = await buildInvoicePdfBuffer(req.params.id, format);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="factura.pdf"`);
  res.send(buffer);
});
