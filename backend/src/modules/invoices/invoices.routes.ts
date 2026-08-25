import { Router } from 'express';
import * as invoicesController from './invoices.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { cancelInvoiceSchema, createInvoiceSchema, listInvoicesSchema } from './invoices.validators';
import { downloadInvoicePdf } from './invoice-pdf.controller';

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth);

invoicesRouter.get('/', requirePermission(PERMISSIONS.INVOICES_VIEW), validate(listInvoicesSchema), invoicesController.listInvoices);
invoicesRouter.get('/:id', requirePermission(PERMISSIONS.INVOICES_VIEW), invoicesController.getInvoice);
invoicesRouter.get('/:id/pdf', requirePermission(PERMISSIONS.INVOICES_VIEW), downloadInvoicePdf);
invoicesRouter.post('/:id/send-email', requirePermission(PERMISSIONS.INVOICES_VIEW), invoicesController.sendInvoiceEmail);
invoicesRouter.post(
  '/',
  requirePermission(PERMISSIONS.INVOICES_CREATE),
  validate(createInvoiceSchema),
  invoicesController.createInvoice,
);
invoicesRouter.post(
  '/:id/cancel',
  requirePermission(PERMISSIONS.INVOICES_VOID),
  validate(cancelInvoiceSchema),
  invoicesController.cancelInvoice,
);
