import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { uploadsDir } from '../../utils/upload';
import { getInvoice } from './invoices.service';
import { getConfig } from '../company/company.service';

type InvoiceWithRelations = Awaited<ReturnType<typeof getInvoice>>;
type CompanyConfig = Awaited<ReturnType<typeof getConfig>>;

function resolveLogoPath(logoUrl: string | null) {
  if (!logoUrl) return null;
  const filename = path.basename(logoUrl);
  const fullPath = path.join(uploadsDir, filename);
  return fs.existsSync(fullPath) ? fullPath : null;
}

export async function buildInvoicePdfBuffer(invoiceId: string, format: 'A4' | 'THERMAL'): Promise<Buffer> {
  const invoice = await getInvoice(invoiceId);
  const company = await getConfig();

  return format === 'THERMAL' ? renderThermal(invoice, company) : renderA4(invoice, company);
}

function renderA4(invoice: InvoiceWithRelations, company: CompanyConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoPath = resolveLogoPath(company.logoUrl);
    let headerTop = doc.y;
    if (logoPath) {
      try {
        doc.image(logoPath, 40, headerTop, { width: 80, height: 80, fit: [80, 80] });
      } catch {
        // ignore invalid image
      }
    }

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(company.tradeName, logoPath ? 130 : 40, headerTop, { width: 300 });
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(company.legalName, logoPath ? 130 : 40, doc.y)
      .text(`NIT: ${company.taxId}`)
      .text(company.address ?? '')
      .text([company.phone, company.email].filter(Boolean).join(' | '));

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`FACTURA ${invoice.fullNumber}`, 350, headerTop, { width: 200, align: 'right' });
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Fecha: ${dayjs(invoice.createdAt).format('YYYY-MM-DD HH:mm')}`, 350, doc.y, { width: 200, align: 'right' })
      .text(`Estado: ${invoice.status}`, { width: 200, align: 'right' });

    doc.moveDown(2);
    const clientTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).text('Datos del cliente', 40, clientTop);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Nombre: ${invoice.client.name}`)
      .text(`NIT/Identificacion: ${invoice.client.taxId ?? 'C/F'}`)
      .text(`Direccion: ${invoice.client.address ?? '-'}`)
      .text(`Telefono: ${invoice.client.phone ?? '-'}`);

    doc.moveDown(1);
    const tableTop = doc.y + 5;
    const cols = [
      { key: 'name', label: 'Descripcion', width: 210 },
      { key: 'qty', label: 'Cant.', width: 45 },
      { key: 'price', label: 'P. Unit.', width: 70 },
      { key: 'discount', label: 'Desc.', width: 60 },
      { key: 'tax', label: 'Impuesto', width: 70 },
      { key: 'total', label: 'Total', width: 70 },
    ];
    let x = 40;
    doc.font('Helvetica-Bold').fontSize(9);
    cols.forEach((c) => {
      doc.text(c.label, x, tableTop, { width: c.width });
      x += c.width;
    });
    doc
      .moveTo(40, tableTop + 14)
      .lineTo(40 + cols.reduce((a, c) => a + c.width, 0), tableTop + 14)
      .stroke();

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(9);
    for (const detail of invoice.details) {
      x = 40;
      const values = [
        detail.product.name,
        Number(detail.quantity).toString(),
        `${company.currencySymbol} ${Number(detail.unitPrice).toFixed(2)}`,
        `${company.currencySymbol} ${Number(detail.discount).toFixed(2)}`,
        `${company.currencySymbol} ${Number(detail.taxAmount).toFixed(2)}`,
        `${company.currencySymbol} ${Number(detail.lineTotal).toFixed(2)}`,
      ];
      values.forEach((v, i) => {
        doc.text(v, x, y, { width: cols[i].width });
        x += cols[i].width;
      });
      y += 16;
    }

    y += 10;
    doc
      .moveTo(340, y)
      .lineTo(40 + cols.reduce((a, c) => a + c.width, 0), y)
      .stroke();
    y += 8;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Subtotal: ${company.currencySymbol} ${Number(invoice.subtotal).toFixed(2)}`, 340, y, { width: 195, align: 'right' });
    y += 15;
    doc.text(`Descuento: ${company.currencySymbol} ${Number(invoice.discount).toFixed(2)}`, 340, y, { width: 195, align: 'right' });
    y += 15;
    doc.text(`Impuesto: ${company.currencySymbol} ${Number(invoice.tax).toFixed(2)}`, 340, y, { width: 195, align: 'right' });
    y += 18;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOTAL: ${company.currencySymbol} ${Number(invoice.total).toFixed(2)}`, 340, y, { width: 195, align: 'right' });

    y += 30;
    doc.font('Helvetica-Bold').fontSize(10).text('Forma de pago', 40, y);
    y += 14;
    doc.font('Helvetica').fontSize(9);
    if (invoice.paymentMethod === 'CREDITO') {
      doc.text('Credito', 40, y);
      if (invoice.creditAccount) {
        doc.text(
          `Saldo pendiente: ${company.currencySymbol} ${Number(invoice.creditAccount.balance).toFixed(2)} - Vence: ${dayjs(invoice.creditAccount.dueDate).format('YYYY-MM-DD')}`,
        );
      }
    } else {
      invoice.payments.forEach((p) => {
        doc.text(`${p.method}: ${company.currencySymbol} ${Number(p.amount).toFixed(2)}`, 40, y);
        y += 12;
      });
    }

    if (invoice.notes) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(10).text('Observaciones');
      doc.font('Helvetica').fontSize(9).text(invoice.notes);
    }

    if (invoice.status === 'ANULADA') {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('red').text('FACTURA ANULADA', { align: 'center' });
      doc.fillColor('black').font('Helvetica').fontSize(9).text(`Motivo: ${invoice.cancelReason ?? '-'}`, { align: 'center' });
    }

    doc.moveDown(2);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('gray')
      .text('Documento generado por el sistema de facturacion.', 40, doc.page.height - 60, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  });
}

function renderThermal(invoice: InvoiceWithRelations, company: CompanyConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 10, size: [227, 900] }); // ~80mm width
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(11).text(company.tradeName, { align: 'center' });
    doc.font('Helvetica').fontSize(7);
    doc.text(company.legalName, { align: 'center' });
    doc.text(`NIT: ${company.taxId}`, { align: 'center' });
    if (company.address) doc.text(company.address, { align: 'center' });
    doc.moveDown(0.5);
    doc.text('--------------------------------', { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9).text(`FACTURA ${invoice.fullNumber}`, { align: 'center' });
    doc.font('Helvetica').fontSize(7);
    doc.text(`Fecha: ${dayjs(invoice.createdAt).format('YYYY-MM-DD HH:mm')}`);
    doc.text(`Cliente: ${invoice.client.name}`);
    doc.text(`NIT/ID: ${invoice.client.taxId ?? 'C/F'}`);
    doc.text('--------------------------------', { align: 'center' });

    for (const detail of invoice.details) {
      doc.font('Helvetica-Bold').fontSize(7).text(detail.product.name);
      doc
        .font('Helvetica')
        .fontSize(7)
        .text(
          `${Number(detail.quantity)} x ${company.currencySymbol}${Number(detail.unitPrice).toFixed(2)} = ${company.currencySymbol}${Number(detail.lineTotal).toFixed(2)}`,
        );
    }

    doc.text('--------------------------------', { align: 'center' });
    doc.fontSize(7).text(`Subtotal: ${company.currencySymbol} ${Number(invoice.subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Descuento: ${company.currencySymbol} ${Number(invoice.discount).toFixed(2)}`, { align: 'right' });
    doc.text(`Impuesto: ${company.currencySymbol} ${Number(invoice.tax).toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(9).text(`TOTAL: ${company.currencySymbol} ${Number(invoice.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(7).text(`Pago: ${invoice.paymentMethod}`);
    if (invoice.status === 'ANULADA') {
      doc.font('Helvetica-Bold').fontSize(9).text('*** ANULADA ***', { align: 'center' });
    }
    doc.moveDown(0.5);
    doc.fontSize(7).text('Gracias por su compra', { align: 'center' });

    doc.end();
  });
}
