import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildPaginationResult } from '../../utils/pagination';

const userSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  roleId: true,
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

interface ListParams {
  search?: string;
  roleId?: string;
  active?: string;
  page?: string;
  pageSize?: string;
}

export async function listUsers(params: ListParams) {
  const { page, pageSize, skip, take } = getPagination(params);
  const where: Prisma.UserWhereInput = {
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { username: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(params.roleId ? { roleId: params.roleId } : {}),
    ...(params.active ? { active: params.active === 'true' } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, skip, take, orderBy: { name: 'asc' } }),
    prisma.user.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, pageSize);
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  return user;
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  roleId: string;
  active?: boolean;
}) {
  const passwordHash = await bcrypt.hash(data.password, env.bcryptSaltRounds);
  return prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      passwordHash,
      roleId: data.roleId,
      active: data.active ?? true,
    },
    select: userSelect,
  });
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; username: string; email: string; roleId: string }>,
) {
  await getUser(id);
  return prisma.user.update({ where: { id }, data, select: userSelect });
}

export async function setUserActive(id: string, active: boolean) {
  await getUser(id);
  return prisma.user.update({ where: { id }, data: { active }, select: userSelect });
}

export async function adminResetPassword(id: string, password: string) {
  await getUser(id);
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}
