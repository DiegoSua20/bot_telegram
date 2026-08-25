import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export async function listCategories(includeInactive = true) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Categoria no encontrada');
  return category;
}

export async function createCategory(data: { name: string; description?: string }) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  await getCategory(id);
  return prisma.category.update({ where: { id }, data });
}

export async function setCategoryActive(id: string, active: boolean) {
  await getCategory(id);
  return prisma.category.update({ where: { id }, data: { active } });
}
