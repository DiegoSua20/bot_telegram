import dayjs from 'dayjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { ReportQuery, ReportResult } from './reports.types';

function range(query: ReportQuery, defaultDays = 30) {
  const to = query.dateTo ? dayjs(query.dateTo).endOf('day') : dayjs().endOf('day');
  const from = query.dateFrom ? dayjs(query.dateFrom).startOf('day') : to.subtract(defaultDays, 'day').startOf('day');
  return { from: from.toDate(), to: to.toDate() };
}

async function ventasPorRango(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } },
    include: { client: { select: { name: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const rows = invoices.map((inv) => ({
    fecha: dayjs(inv.createdAt).format('YYYY-MM-DD HH:mm'),
    numero: inv.fullNumber,
    cliente: inv.client.name,
    usuario: inv.user.name,
    subtotal: Number(inv.subtotal),
    impuesto: Number(inv.tax),
    total: Number(inv.total),
    estado: inv.status,
    metodoPago: inv.paymentMethod,
  }));
  return {
    title: 'Ventas por rango de fechas',
    columns: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'numero', label: 'Numero' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'impuesto', label: 'Impuesto' },
      { key: 'total', label: 'Total' },
      { key: 'estado', label: 'Estado' },
      { key: 'metodoPago', label: 'Metodo de pago' },
    ],
    rows,
    totals: { total: rows.reduce((a, r) => a + (r.total as number), 0) },
  };
}

async function ventasDiarias(query: ReportQuery): Promise<ReportResult> {
  const day = query.dateFrom ?? dayjs().format('YYYY-MM-DD');
  const result = await ventasPorRango({ dateFrom: day, dateTo: day });
  return { ...result, title: `Ventas diarias (${day})` };
}

async function ventasMensuales(query: ReportQuery): Promise<ReportResult> {
  const month = query.dateFrom ? dayjs(query.dateFrom) : dayjs();
  const from = month.startOf('month').format('YYYY-MM-DD');
  const to = month.endOf('month').format('YYYY-MM-DD');
  const result = await ventasPorRango({ dateFrom: from, dateTo: to });
  return { ...result, title: `Ventas mensuales (${month.format('YYYY-MM')})` };
}

async function ventasPorProducto(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const details = await prisma.invoiceDetail.findMany({
    where: { invoice: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } } },
    include: { product: { select: { id: true, name: true, sku: true } } },
  });
  const map = new Map<string, { producto: string; sku: string; cantidad: number; total: number }>();
  for (const d of details) {
    const key = d.product.id;
    const existing = map.get(key) ?? { producto: d.product.name, sku: d.product.sku, cantidad: 0, total: 0 };
    existing.cantidad += Number(d.quantity);
    existing.total += Number(d.lineTotal);
    map.set(key, existing);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return {
    title: 'Ventas por producto',
    columns: [
      { key: 'producto', label: 'Producto' },
      { key: 'sku', label: 'SKU' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'total', label: 'Total' },
    ],
    rows,
    totals: { total: rows.reduce((a, r) => a + r.total, 0) },
  };
}

async function ventasPorCategoria(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const details = await prisma.invoiceDetail.findMany({
    where: { invoice: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } } },
    include: { product: { select: { category: { select: { name: true } } } } },
  });
  const map = new Map<string, { categoria: string; cantidad: number; total: number }>();
  for (const d of details) {
    const key = d.product.category?.name ?? 'Sin categoria';
    const existing = map.get(key) ?? { categoria: key, cantidad: 0, total: 0 };
    existing.cantidad += Number(d.quantity);
    existing.total += Number(d.lineTotal);
    map.set(key, existing);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return {
    title: 'Ventas por categoria',
    columns: [
      { key: 'categoria', label: 'Categoria' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'total', label: 'Total' },
    ],
    rows,
    totals: { total: rows.reduce((a, r) => a + r.total, 0) },
  };
}

async function ventasPorCliente(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } },
    include: { client: { select: { name: true, code: true } } },
  });
  const map = new Map<string, { cliente: string; codigo: string; facturas: number; total: number }>();
  for (const inv of invoices) {
    const key = inv.clientId;
    const existing = map.get(key) ?? { cliente: inv.client.name, codigo: inv.client.code, facturas: 0, total: 0 };
    existing.facturas += 1;
    existing.total += Number(inv.total);
    map.set(key, existing);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return {
    title: 'Ventas por cliente',
    columns: [
      { key: 'cliente', label: 'Cliente' },
      { key: 'codigo', label: 'Codigo' },
      { key: 'facturas', label: 'Facturas' },
      { key: 'total', label: 'Total' },
    ],
    rows,
    totals: { total: rows.reduce((a, r) => a + r.total, 0) },
  };
}

async function ventasPorUsuario(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } },
    include: { user: { select: { name: true } } },
  });
  const map = new Map<string, { usuario: string; facturas: number; total: number }>();
  for (const inv of invoices) {
    const key = inv.userId;
    const existing = map.get(key) ?? { usuario: inv.user.name, facturas: 0, total: 0 };
    existing.facturas += 1;
    existing.total += Number(inv.total);
    map.set(key, existing);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return {
    title: 'Ventas por usuario',
    columns: [
      { key: 'usuario', label: 'Usuario' },
      { key: 'facturas', label: 'Facturas' },
      { key: 'total', label: 'Total' },
    ],
    rows,
    totals: { total: rows.reduce((a, r) => a + r.total, 0) },
  };
}

async function productosMasVendidos(query: ReportQuery): Promise<ReportResult> {
  const result = await ventasPorProducto(query);
  const rows = [...result.rows].sort((a, b) => (b.cantidad as number) - (a.cantidad as number)).slice(0, 20);
  return { ...result, title: 'Productos mas vendidos', rows };
}

async function reporteInventario(): Promise<ReportResult> {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  const rows = products.map((p) => ({
    sku: p.sku,
    nombre: p.name,
    categoria: p.category?.name ?? '-',
    tipo: p.type,
    existencia: p.trackInventory ? Number(p.stock) : null,
    minimo: p.trackInventory ? Number(p.minStock) : null,
    costo: Number(p.costPrice),
    precio: Number(p.salePrice),
    valorInventario: p.trackInventory ? Number(p.stock) * Number(p.costPrice) : 0,
  }));
  return {
    title: 'Inventario actual',
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'existencia', label: 'Existencia' },
      { key: 'minimo', label: 'Minimo' },
      { key: 'costo', label: 'Costo' },
      { key: 'precio', label: 'Precio' },
      { key: 'valorInventario', label: 'Valor inventario' },
    ],
    rows,
    totals: { valorInventario: rows.reduce((a, r) => a + (r.valorInventario as number), 0) },
  };
}

async function bajoInventario(): Promise<ReportResult> {
  const result = await reporteInventario();
  const rows = result.rows.filter((r) => r.existencia !== null && (r.existencia as number) <= (r.minimo as number));
  return { ...result, title: 'Productos con bajo inventario', rows, totals: undefined };
}

async function kardexReport(query: ReportQuery): Promise<ReportResult> {
  if (!query.productId) throw ApiError.badRequest('Debe indicar el producto (productId) para el kardex');
  const { from, to } = range(query, 365);
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId: query.productId, createdAt: { gte: from, lte: to } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const rows = movements.map((m) => ({
    fecha: dayjs(m.createdAt).format('YYYY-MM-DD HH:mm'),
    tipo: m.type,
    cantidad: Number(m.quantity),
    saldo: Number(m.balanceAfter),
    motivo: m.reason,
    referencia: m.reference ?? '-',
    usuario: m.user.name,
  }));
  return {
    title: 'Kardex de producto',
    columns: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'saldo', label: 'Saldo' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'referencia', label: 'Referencia' },
      { key: 'usuario', label: 'Usuario' },
    ],
    rows,
  };
}

async function facturasAnuladas(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const invoices = await prisma.invoice.findMany({
    where: { status: 'ANULADA', cancelledAt: { gte: from, lte: to } },
    include: { client: { select: { name: true } }, cancelledBy: { select: { name: true } } },
    orderBy: { cancelledAt: 'desc' },
  });
  const rows = invoices.map((inv) => ({
    numero: inv.fullNumber,
    cliente: inv.client.name,
    total: Number(inv.total),
    fechaAnulacion: dayjs(inv.cancelledAt).format('YYYY-MM-DD HH:mm'),
    anuladoPor: inv.cancelledBy?.name ?? '-',
    motivo: inv.cancelReason ?? '-',
  }));
  return {
    title: 'Facturas anuladas',
    columns: [
      { key: 'numero', label: 'Numero' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'total', label: 'Total' },
      { key: 'fechaAnulacion', label: 'Fecha anulacion' },
      { key: 'anuladoPor', label: 'Anulado por' },
      { key: 'motivo', label: 'Motivo' },
    ],
    rows,
  };
}

async function cuentasPorCobrar(query: ReportQuery): Promise<ReportResult> {
  const accounts = await prisma.creditAccount.findMany({
    where: query.status ? undefined : { balance: { gt: 0 } },
    include: { client: { select: { name: true } }, invoice: { select: { fullNumber: true } } },
    orderBy: { dueDate: 'asc' },
  });
  const rows = accounts.map((a) => ({
    factura: a.invoice.fullNumber,
    cliente: a.client.name,
    total: Number(a.totalAmount),
    pagado: Number(a.paidAmount),
    saldo: Number(a.balance),
    vencimiento: dayjs(a.dueDate).format('YYYY-MM-DD'),
    estado: a.balance.toNumber() <= 0 ? 'PAGADO' : dayjs(a.dueDate).isBefore(dayjs()) ? 'VENCIDO' : a.status,
  }));
  return {
    title: 'Cuentas por cobrar',
    columns: [
      { key: 'factura', label: 'Factura' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'total', label: 'Total' },
      { key: 'pagado', label: 'Pagado' },
      { key: 'saldo', label: 'Saldo' },
      { key: 'vencimiento', label: 'Vencimiento' },
      { key: 'estado', label: 'Estado' },
    ],
    rows,
    totals: { saldo: rows.reduce((a, r) => a + r.saldo, 0) },
  };
}

async function pagosRecibidos(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const [payments, creditPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { invoice: { select: { fullNumber: true, client: { select: { name: true } } } } },
    }),
    prisma.creditPayment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        creditAccount: { include: { invoice: { select: { fullNumber: true } }, client: { select: { name: true } } } },
      },
    }),
  ]);
  const rows = [
    ...payments.map((p) => ({
      fecha: dayjs(p.createdAt).format('YYYY-MM-DD HH:mm'),
      tipo: 'Contado',
      factura: p.invoice.fullNumber,
      cliente: p.invoice.client.name,
      metodo: p.method,
      monto: Number(p.amount),
    })),
    ...creditPayments.map((p) => ({
      fecha: dayjs(p.createdAt).format('YYYY-MM-DD HH:mm'),
      tipo: 'Abono credito',
      factura: p.creditAccount.invoice.fullNumber,
      cliente: p.creditAccount.client.name,
      metodo: p.method,
      monto: Number(p.amount),
    })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return {
    title: 'Pagos recibidos',
    columns: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'factura', label: 'Factura' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'metodo', label: 'Metodo' },
      { key: 'monto', label: 'Monto' },
    ],
    rows,
    totals: { monto: rows.reduce((a, r) => a + r.monto, 0) },
  };
}

async function reporteCaja(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const sessions = await prisma.cashSession.findMany({
    where: { openedAt: { gte: from, lte: to } },
    include: { user: { select: { name: true } } },
    orderBy: { openedAt: 'desc' },
  });
  const rows = sessions.map((s) => ({
    usuario: s.user.name,
    apertura: dayjs(s.openedAt).format('YYYY-MM-DD HH:mm'),
    cierre: s.closedAt ? dayjs(s.closedAt).format('YYYY-MM-DD HH:mm') : '-',
    montoInicial: Number(s.openingAmount),
    montoEsperado: s.expectedAmount ? Number(s.expectedAmount) : null,
    montoDeclarado: s.declaredAmount ? Number(s.declaredAmount) : null,
    diferencia: s.difference ? Number(s.difference) : null,
    estado: s.status,
  }));
  return {
    title: 'Reporte de caja',
    columns: [
      { key: 'usuario', label: 'Usuario' },
      { key: 'apertura', label: 'Apertura' },
      { key: 'cierre', label: 'Cierre' },
      { key: 'montoInicial', label: 'Monto inicial' },
      { key: 'montoEsperado', label: 'Monto esperado' },
      { key: 'montoDeclarado', label: 'Monto declarado' },
      { key: 'diferencia', label: 'Diferencia' },
      { key: 'estado', label: 'Estado' },
    ],
    rows,
  };
}

async function reporteGastos(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from, lte: to } },
    include: { user: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  const rows = expenses.map((e) => ({
    fecha: dayjs(e.date).format('YYYY-MM-DD'),
    categoria: e.category,
    descripcion: e.description,
    monto: Number(e.amount),
    metodoPago: e.paymentMethod,
    usuario: e.user.name,
    referencia: e.referenceDoc ?? '-',
  }));
  return {
    title: 'Gastos',
    columns: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'monto', label: 'Monto' },
      { key: 'metodoPago', label: 'Metodo de pago' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'referencia', label: 'Referencia' },
    ],
    rows,
    totals: { monto: rows.reduce((a, r) => a + r.monto, 0) },
  };
}

async function utilidadesAproximadas(query: ReportQuery): Promise<ReportResult> {
  const { from, to } = range(query);
  const details = await prisma.invoiceDetail.findMany({
    where: { invoice: { createdAt: { gte: from, lte: to }, status: { not: 'ANULADA' } } },
    include: { product: { select: { name: true, sku: true, costPrice: true } } },
  });
  const map = new Map<string, { producto: string; cantidad: number; ingresos: number; costo: number }>();
  for (const d of details) {
    const key = d.productId;
    const existing = map.get(key) ?? { producto: d.product.name, cantidad: 0, ingresos: 0, costo: 0 };
    existing.cantidad += Number(d.quantity);
    existing.ingresos += Number(d.lineTotal) - Number(d.taxAmount);
    existing.costo += Number(d.quantity) * Number(d.product.costPrice);
    map.set(key, existing);
  }
  const rows = Array.from(map.values())
    .map((r) => ({ ...r, utilidad: Math.round((r.ingresos - r.costo) * 100) / 100 }))
    .sort((a, b) => b.utilidad - a.utilidad);
  return {
    title: 'Utilidades aproximadas',
    columns: [
      { key: 'producto', label: 'Producto' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'ingresos', label: 'Ingresos' },
      { key: 'costo', label: 'Costo' },
      { key: 'utilidad', label: 'Utilidad' },
    ],
    rows,
    totals: { utilidad: rows.reduce((a, r) => a + r.utilidad, 0) },
  };
}

const REPORTS: Record<string, (query: ReportQuery) => Promise<ReportResult>> = {
  'ventas-diarias': ventasDiarias,
  'ventas-mensuales': ventasMensuales,
  'ventas-por-rango': ventasPorRango,
  'ventas-por-producto': ventasPorProducto,
  'ventas-por-categoria': ventasPorCategoria,
  'ventas-por-cliente': ventasPorCliente,
  'ventas-por-usuario': ventasPorUsuario,
  'productos-mas-vendidos': productosMasVendidos,
  inventario: reporteInventario,
  'bajo-inventario': bajoInventario,
  kardex: kardexReport,
  'facturas-anuladas': facturasAnuladas,
  'cuentas-por-cobrar': cuentasPorCobrar,
  'pagos-recibidos': pagosRecibidos,
  caja: reporteCaja,
  gastos: reporteGastos,
  utilidades: utilidadesAproximadas,
};

export const REPORT_TYPES = Object.keys(REPORTS);

export async function getReport(type: string, query: ReportQuery): Promise<ReportResult> {
  const handler = REPORTS[type];
  if (!handler) throw ApiError.notFound(`Reporte no encontrado: ${type}`);
  return handler(query);
}
