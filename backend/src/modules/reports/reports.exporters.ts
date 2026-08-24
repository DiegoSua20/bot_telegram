import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportResult } from './reports.types';

export async function exportToExcel(report: ReportResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(report.title.slice(0, 31));

  sheet.columns = report.columns.map((c) => ({ header: c.label, key: c.key, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  report.rows.forEach((row) => sheet.addRow(row));

  if (report.totals) {
    const totalsRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(report.totals)) {
      totalsRow[key] = value;
    }
    const firstColKey = report.columns[0]?.key;
    if (firstColKey && !(firstColKey in totalsRow)) {
      totalsRow[firstColKey] = 'TOTAL';
    }
    const row = sheet.addRow(totalsRow);
    row.font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportToPdf(report: ReportResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(report.title, { align: 'center' });
    doc.moveDown();

    const colCount = report.columns.length;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / colCount;
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    report.columns.forEach((col, i) => {
      doc.text(col.label, doc.page.margins.left + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
    y += 16;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
    y += 4;

    doc.font('Helvetica').fontSize(8);
    for (const row of report.rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      report.columns.forEach((col, i) => {
        const value = row[col.key];
        const text = value === null || value === undefined ? '-' : String(value);
        doc.text(text, doc.page.margins.left + i * colWidth, y, { width: colWidth, ellipsis: true });
      });
      y += 14;
    }

    if (report.totals) {
      y += 8;
      doc.font('Helvetica-Bold');
      doc.text(`Totales: ${JSON.stringify(report.totals)}`, doc.page.margins.left, y);
    }

    doc.end();
  });
}
