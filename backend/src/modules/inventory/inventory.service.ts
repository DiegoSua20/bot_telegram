import { MovementType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';
import { Tx } from '../../utils/prismaTx';

interface ListParams {
  productId?: string;
  type?: MovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  pageSize?: string;
}

export async function listMovements(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.InventoryMovementWhereInput = {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          createdAt: {
            ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, sku: true, unit: true } }, user: { select: { id: true, name: true } } },
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

export async function getKardex(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Producto no encontrado');
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true } } },
  });
  return { product, movements };
}

interface RegisterMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  reference?: string;
  userId: string;
}

export async function registerMovement(input: RegisterMovementInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw ApiError.notFound('Producto no encontrado');
    if (!product.trackInventory) {
      throw ApiError.badRequest('Este producto/servicio no tiene control de inventario');
    }

    let newStock: number;
    const currentStock = Number(product.stock);

    if (input.type === 'ENTRADA') {
      newStock = currentStock + input.quantity;
    } else if (input.type === 'SALIDA') {
      if (input.quantity > currentStock) {
        throw ApiError.badRequest('No hay suficiente existencia para esta salida');
      }
      newStock = currentStock - input.quantity;
    } else {
      // AJUSTE: quantity es el nuevo saldo absoluto
      newStock = input.quantity;
    }

    const updated = await tx.product.update({ where: { id: input.productId }, data: { stock: newStock } });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        quantity:
          input.type === 'AJUSTE' ? new Prisma.Decimal(newStock).minus(currentStock) : new Prisma.Decimal(input.quantity),
        balanceAfter: updated.stock,
        reason: input.reason,
        reference: input.reference,
        userId: input.userId,
      },
    });

    return movement;
  });
}

export async function applyInvoiceStockDeduction(
  tx: Tx,
  items: { productId: string; quantity: number }[],
  userId: string,
  invoiceFullNumber: string,
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) throw ApiError.notFound('Producto no encontrado');
    if (!product.trackInventory) continue;

    const companyConfig = await tx.companyConfig.findFirst();
    const allowOversell = companyConfig?.allowOversell ?? false;
    const currentStock = Number(product.stock);
    if (!allowOversell && item.quantity > currentStock) {
      throw ApiError.badRequest(`Existencia insuficiente para ${product.name}. Disponible: ${currentStock}`);
    }

    const newStock = currentStock - item.quantity;
    const updated = await tx.product.update({ where: { id: item.productId }, data: { stock: newStock } });

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        type: 'SALIDA',
        quantity: item.quantity,
        balanceAfter: updated.stock,
        reason: `Venta - Factura ${invoiceFullNumber}`,
        reference: invoiceFullNumber,
        userId,
      },
    });
  }
}

export async function reverseInvoiceStockDeduction(
  tx: Tx,
  items: { productId: string; quantity: number }[],
  userId: string,
  invoiceFullNumber: string,
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.trackInventory) continue;

    const currentStock = Number(product.stock);
    const newStock = currentStock + item.quantity;
    const updated = await tx.product.update({ where: { id: item.productId }, data: { stock: newStock } });

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        type: 'ENTRADA',
        quantity: item.quantity,
        balanceAfter: updated.stock,
        reason: `Anulacion de factura ${invoiceFullNumber}`,
        reference: invoiceFullNumber,
        userId,
      },
    });
  }
}
