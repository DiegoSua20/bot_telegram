import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as invoicesService from './invoices.service';

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoicesService.createInvoice({ ...req.body, userId: req.user!.id });
  await writeAudit({
    userId: req.user!.id,
    action: 'CREATE',
    module: 'invoices',
    recordId: invoice.id,
    newData: invoice,
  });
  res.status(201).json(invoice);
});

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  res.json(await invoicesService.listInvoices(req.query as Record<string, string>));
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  res.json(await invoicesService.getInvoice(req.params.id));
});

export const cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoicesService.cancelInvoice(req.params.id, req.body.reason, req.user!.id);
  await writeAudit({
    userId: req.user!.id,
    action: 'VOID',
    module: 'invoices',
    recordId: invoice.id,
    newData: invoice,
  });
  res.json(invoice);
});
