import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';

interface ListParams {
  search?: string;
  categoryId?: string;
  type?: 'PRODUCTO' | 'SERVICIO';
  active?: string;
  lowStock?: string;
  page?: string;
  pageSize?: string;
}

async function generateSku() {
  const count = await prisma.product.count();
  return `PRD-${String(count + 1).padStart(5, '0')}`;
}

export async function listProducts(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.ProductWhereInput = {
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { sku: { contains: params.search, mode: 'insensitive' } },
            { barcode: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.active ? { active: params.active === 'true' } : {}),
  };

  if (params.lowStock === 'true') {
    const candidates = await prisma.product.findMany({
      where: { ...where, trackInventory: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    const lowStockItems = candidates.filter((p) => Number(p.stock) <= Number(p.minStock));
    const total = lowStockItems.length;
    const items = lowStockItems.slice(skip, skip + take);
    return buildPaginationResult(items, total, page, pageSize);
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take, orderBy: { name: 'asc' }, include: { category: true } }),
    prisma.product.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

export async function getFrequentProducts(limit = 8) {
  const grouped = await prisma.invoiceDetail.groupBy({
    by: ['productId'],
    where: { invoice: { status: { not: 'ANULADA' } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  if (grouped.length === 0) {
    // Sin historial de ventas todavia (negocio nuevo): mostrar los primeros productos activos.
    return prisma.product.findMany({
      where: { active: true },
      take: limit,
      orderBy: { name: 'asc' },
      include: { category: true },
    });
  }

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { category: true },
  });
  const rank = new Map(productIds.map((id, index) => [id, index]));
  return products.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
}

export async function searchProducts(term: string) {
  if (!term) return [];
  return prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { name: 'asc' },
    include: { category: true },
  });
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) throw ApiError.notFound('Producto no encontrado');
  return product;
}

export async function getProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({ where: { barcode } });
  if (!product) throw ApiError.notFound('Producto no encontrado');
  return product;
}

interface ProductInput {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  type: 'PRODUCTO' | 'SERVICIO';
  salePrice: number;
  costPrice: number;
  taxRate: number;
  trackInventory: boolean;
  stock: number;
  minStock: number;
  unit: string;
  active?: boolean;
}

export async function createProduct(data: ProductInput) {
  const sku = data.sku && data.sku.trim() ? data.sku.trim() : await generateSku();
  const trackInventory = data.type === 'SERVICIO' ? false : data.trackInventory;
  return prisma.product.create({
    data: {
      ...data,
      sku,
      trackInventory,
      barcode: data.barcode && data.barcode.trim() ? data.barcode.trim() : null,
      categoryId: data.categoryId || null,
      stock: trackInventory ? data.stock : 0,
    },
  });
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  await getProduct(id);
  const trackInventory = data.type === 'SERVICIO' ? false : data.trackInventory;
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(data.type !== undefined ? { trackInventory } : {}),
      barcode: data.barcode !== undefined ? (data.barcode.trim() || null) : undefined,
      categoryId: data.categoryId !== undefined ? data.categoryId || null : undefined,
    },
  });
}

export async function setProductActive(id: string, active: boolean) {
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: { active } });
}
