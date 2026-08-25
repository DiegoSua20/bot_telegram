import dayjs from 'dayjs';
import { prisma } from '../../config/prisma';

export async function getDashboardData() {
  const startOfDay = dayjs().startOf('day').toDate();
  const endOfDay = dayjs().endOf('day').toDate();
  const startOfMonth = dayjs().startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();
  const chartStart = dayjs().subtract(13, 'day').startOf('day').toDate();

  const [
    salesTodayAgg,
    salesMonthAgg,
    invoicesIssuedToday,
    invoicesVoidedToday,
    clientsRegistered,
    paymentsToday,
    creditPaymentsToday,
    pendingCreditAgg,
    latestInvoices,
    lowStockProducts,
    chartInvoices,
    monthDetails,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: { not: 'ANULADA' }, createdAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: { not: 'ANULADA' }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.invoice.count({ where: { status: { not: 'ANULADA' }, createdAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.invoice.count({ where: { status: 'ANULADA', cancelledAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.client.count({ where: { active: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.creditPayment.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.creditAccount.aggregate({ _sum: { balance: true }, where: { balance: { gt: 0 } } }),
    prisma.invoice.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, user: { select: { name: true } } },
    }),
    prisma.product.findMany({ where: { active: true, trackInventory: true } }),
    prisma.invoice.findMany({
      where: { status: { not: 'ANULADA' }, createdAt: { gte: chartStart } },
      select: { total: true, createdAt: true },
    }),
    prisma.invoiceDetail.findMany({
      where: { invoice: { status: { not: 'ANULADA' }, createdAt: { gte: startOfMonth, lte: endOfMonth } } },
      select: { quantity: true, lineTotal: true, product: { select: { id: true, name: true, sku: true } } },
    }),
  ]);

  const lowStock = lowStockProducts
    .filter((p) => Number(p.stock) <= Number(p.minStock))
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 15);

  const chartMap = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const key = dayjs(chartStart).add(i, 'day').format('YYYY-MM-DD');
    chartMap.set(key, 0);
  }
  for (const inv of chartInvoices) {
    const key = dayjs(inv.createdAt).format('YYYY-MM-DD');
    chartMap.set(key, (chartMap.get(key) ?? 0) + Number(inv.total));
  }
  const salesChart = Array.from(chartMap.entries()).map(([date, total]) => ({ date, total }));

  const topProductsMap = new Map<string, { productId: string; name: string; sku: string; quantity: number; total: number }>();
  for (const detail of monthDetails) {
    const key = detail.product.id;
    const existing = topProductsMap.get(key) ?? {
      productId: key,
      name: detail.product.name,
      sku: detail.product.sku,
      quantity: 0,
      total: 0,
    };
    existing.quantity += Number(detail.quantity);
    existing.total += Number(detail.lineTotal);
    topProductsMap.set(key, existing);
  }
  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    salesToday: Number(salesTodayAgg._sum.total ?? 0),
    salesMonth: Number(salesMonthAgg._sum.total ?? 0),
    invoicesIssuedToday,
    invoicesVoidedToday,
    totalCollectedToday: Number(paymentsToday._sum.amount ?? 0) + Number(creditPaymentsToday._sum.amount ?? 0),
    totalPending: Number(pendingCreditAgg._sum.balance ?? 0),
    clientsRegistered,
    lowStockProducts: lowStock,
    lowStockCount: lowStock.length,
    salesChart,
    topProducts,
    latestInvoices,
  };
}
