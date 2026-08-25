import { ApiError } from '../../utils/ApiError';
import { sendMail } from '../../utils/mailer';
import { getInvoice } from './invoices.service';
import { getConfig } from '../company/company.service';
import { buildInvoicePdfBuffer } from './invoice-pdf.service';

export async function sendInvoiceByEmail(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice.client.email) {
    throw ApiError.badRequest('El cliente no tiene un correo electronico registrado');
  }

  const company = await getConfig();
  const pdfBuffer = await buildInvoicePdfBuffer(invoiceId, 'A4');

  const html = `
    <p>Estimado(a) ${invoice.client.name},</p>
    <p>Adjunto encontrara su factura <strong>${invoice.fullNumber}</strong> por un total de
    <strong>${company.currencySymbol} ${Number(invoice.total).toFixed(2)}</strong>, emitida por ${company.tradeName}.</p>
    <p>Gracias por su compra.</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Este es un correo generado automaticamente, por favor no responda a este mensaje.</p>
  `;

  const result = await sendMail({
    to: invoice.client.email,
    subject: `Factura ${invoice.fullNumber} - ${company.tradeName}`,
    html,
    attachments: [
      {
        filename: `${invoice.fullNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return { sent: result.sent, email: invoice.client.email };
}
