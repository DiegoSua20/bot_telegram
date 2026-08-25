import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';
import * as seriesService from '../series/series.service';
import * as inventoryService from '../inventory/inventory.service';
import * as cashService from '../cash/cash.service';

const round2 = (n: number) => Math.round(n * 100) / 100;

interface ItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount: number;
}

interface PaymentInput {
  method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  amount: number;
  reference?: string;
}

interface CreateInvoiceInput {
  clientId: string;
  seriesId?: string;
  items: ItemInput[];
  discount: number;
  notes?: string;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE' | 'CREDITO' | 'COMBINADO';
  payments: PaymentInput[];
  creditDueDate?: string;
  userId: string;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw ApiError.notFound('Cliente no encontrado');
  if (!client.active) throw ApiError.badRequest('El cliente esta inactivo');

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  for (const item of input.items) {
    const product = productsById.get(item.productId);
    if (!product) throw ApiError.notFound(`Producto no encontrado: ${item.productId}`);
    if (!product.active) throw ApiError.badRequest(`El producto ${product.name} esta inactivo`);
  }

  let subtotal = 0;
  let tax = 0;
  let lineDiscountTotal = 0;
  const detailData = input.items.map((item) => {
    const product = productsById.get(item.productId)!;
    const unitPrice = item.unitPrice ?? Number(product.salePrice);
    const taxRate = Number(product.taxRate);
    const gross = item.quantity * unitPrice;
    const net = Math.max(0, gross - item.discount);
    const taxAmount = round2(net * (taxRate / 100));
    const lineTotal = round2(net + taxAmount);
    subtotal += net;
    tax += taxAmount;
    lineDiscountTotal += item.discount;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      discount: item.discount,
      taxRate,
      taxAmount,
      lineTotal,
    };
  });

  subtotal = round2(Math.max(0, subtotal - input.discount));
  tax = round2(tax);
  const total = round2(subtotal + tax);
  const totalDiscount = round2(lineDiscountTotal + input.discount);

  const isCredit = input.paymentMethod === 'CREDITO';
  if (!isCredit) {
    const paidTotal = round2(input.payments.reduce((acc, p) => acc + p.amount, 0));
    if (input.payments.length === 0) {
      throw ApiError.badRequest('Debe registrar al menos una forma de pago');
    }
    if (Math.abs(paidTotal - total) > 0.01) {
      throw ApiError.badRequest(
        `El total pagado (${paidTotal}) no coincide con el total de la factura (${total})`,
      );
    }
  }

  const series = input.seriesId
    ? await prisma.series.findUnique({ where: { id: input.seriesId } })
    : await seriesService.getDefaultActiveSeries();
  if (!series) throw ApiError.notFound('Serie no encontrada');
  if (!series.active) throw ApiError.badRequest('La serie seleccionada esta inactiva');

  const openSession = await cashService.findOpenSessionForUser(input.userId);

  if (!isCredit && !openSession) {
    const companyConfig = await prisma.companyConfig.findFirst();
    if (companyConfig?.requireOpenCashRegister) {
      throw ApiError.badRequest('Debe abrir su caja antes de poder facturar. Vaya al modulo de Caja.');
    }
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await seriesService.reserveNextNumber(tx, series.id);
    const fullNumber = `${series.name}-${String(number).padStart(6, '0')}`;

    const created = await tx.invoice.create({
      data: {
        seriesId: series.id,
        number,
        fullNumber,
        clientId: input.clientId,
        userId: input.userId,
        subtotal,
        discount: totalDiscount,
        tax,
        total,
        status: isCredit ? 'PENDIENTE' : 'PAGADA',
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        cashSessionId: !isCredit && openSession ? openSession.id : null,
        details: { create: detailData },
        payments: !isCredit ? { create: input.payments } : undefined,
      },
      include: { details: true, payments: true, client: true },
    });

    await inventoryService.applyInvoiceStockDeduction(
      tx,
      input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      input.userId,
      fullNumber,
    );

    if (isCredit) {
      const dueDate = input.creditDueDate ? new Date(input.creditDueDate) : new Date(Date.now() + 30 * 86400000);
      await tx.creditAccount.create({
        data: {
          invoiceId: created.id,
          clientId: input.clientId,
          totalAmount: total,
          paidAmount: 0,
          balance: total,
          dueDate,
          status: 'PENDIENTE',
        },
      });
    } else if (openSession) {
      await cashService.recordSaleCashMovements(tx, openSession.id, input.payments, fullNumber);
    }

    return created;
  });

  return invoice;
}

const invoiceInclude = {
  client: true,
  user: { select: { id: true, name: true, username: true } },
  series: true,
  details: { include: { product: true } },
  payments: true,
  creditAccount: true,
  cancelledBy: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceInclude;

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw ApiError.notFound('Factura no encontrada');
  return invoice;
}

interface ListParams {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  fullNumber?: string;
  userId?: string;
  status?: string;
  paymentMethod?: string;
  page?: string;
  pageSize?: string;
}

export async function listInvoices(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.InvoiceWhereInput = {
    ...(params.dateFrom || params.dateTo
      ? {
          createdAt: {
            ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.fullNumber ? { fullNumber: { contains: params.fullNumber, mode: 'insensitive' } } : {}),
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.status ? { status: params.status as Prisma.EnumInvoiceStatusFilter['equals'] } : {}),
    ...(params.paymentMethod ? { paymentMethod: params.paymentMethod as Prisma.EnumPaymentMethodFilter['equals'] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

export async function cancelInvoice(id: string, reason: string, userId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { details: true, payments: true, creditAccount: true },
  });
  if (!invoice) throw ApiError.notFound('Factura no encontrada');
  if (invoice.status === 'ANULADA') throw ApiError.badRequest('La factura ya se encuentra anulada');
  if (invoice.creditAccount && Number(invoice.creditAccount.paidAmount) > 0) {
    throw ApiError.badRequest(
      'No se puede anular: ya existen abonos registrados en la cuenta por cobrar de esta factura',
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: 'ANULADA',
        cancelReason: reason,
        cancelledById: userId,
        cancelledAt: new Date(),
      },
    });

    await inventoryService.reverseInvoiceStockDeduction(
      tx,
      invoice.details.map((d) => ({ productId: d.productId, quantity: Number(d.quantity) })),
      userId,
      invoice.fullNumber,
    );

    if (invoice.creditAccount) {
      await tx.creditAccount.delete({ where: { id: invoice.creditAccount.id } });
    } else if (invoice.cashSessionId && invoice.payments.length > 0) {
      await cashService.reverseSaleCashMovements(
        tx,
        invoice.cashSessionId,
        invoice.payments.map((p) => ({ method: p.method, amount: Number(p.amount) })),
        invoice.fullNumber,
      );
    }

    return updated;
  });
}
