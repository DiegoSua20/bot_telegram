import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';

interface ListParams {
  search?: string;
  active?: string;
  page?: string;
  pageSize?: string;
}

async function generateCode() {
  const count = await prisma.client.count();
  const next = count + 1;
  const code = `CLI-${String(next).padStart(5, '0')}`;
  const exists = await prisma.client.findUnique({ where: { code } });
  if (exists) {
    return `CLI-${Date.now()}`;
  }
  return code;
}

export async function listClients(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.ClientWhereInput = {
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { code: { contains: params.search, mode: 'insensitive' } },
            { taxId: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(params.active ? { active: params.active === 'true' } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.client.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

export async function searchClients(term: string) {
  if (!term) return [];
  return prisma.client.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { taxId: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 15,
    orderBy: { name: 'asc' },
  });
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw ApiError.notFound('Cliente no encontrado');
  return client;
}

export async function createClient(data: {
  code?: string;
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  notes?: string;
  active?: boolean;
}) {
  const code = data.code && data.code.trim() ? data.code.trim() : await generateCode();
  return prisma.client.create({ data: { ...data, code, email: data.email || null } });
}

export async function updateClient(id: string, data: Partial<Prisma.ClientUpdateInput>) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data });
}

export async function setClientActive(id: string, active: boolean) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data: { active } });
}
