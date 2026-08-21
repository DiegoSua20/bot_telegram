import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as creditService from './credit.service';

export const listCreditAccounts = asyncHandler(async (req: Request, res: Response) => {
  res.json(await creditService.listCreditAccounts(req.query as Record<string, string>));
});

export const getCreditAccount = asyncHandler(async (req: Request, res: Response) => {
  res.json(await creditService.getCreditAccount(req.params.id));
});

export const registerPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await creditService.registerPayment(
    req.params.id,
    req.body.amount,
    req.body.method,
    req.body.reference,
    req.user!.id,
  );
  await writeAudit({
    userId: req.user!.id,
    action: 'REGISTER_PAYMENT',
    module: 'credit',
    recordId: req.params.id,
    newData: result.payment,
  });
  res.status(201).json(result);
});
