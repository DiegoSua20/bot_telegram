import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export async function listRoles() {
  return prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
}

export async function createRole(name: string, description: string | undefined, permissionIds: string[]) {
  return prisma.role.create({
    data: {
      name,
      description,
      permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
    },
    include: { permissions: { include: { permission: true } } },
  });
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound('Rol no encontrado');

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    }),
  ]);

  return prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });
}

export async function updateRole(roleId: string, data: { name?: string; description?: string }) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound('Rol no encontrado');
  return prisma.role.update({ where: { id: roleId }, data });
}
