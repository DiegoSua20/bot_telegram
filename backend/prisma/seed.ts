import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSION_LIST, ROLE_DEFINITIONS } from '../src/utils/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando permisos...');
  for (const perm of PERMISSION_LIST) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
  }

  console.log('Sembrando roles...');
  for (const [roleName, def] of Object.entries(ROLE_DEFINITIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: def.description },
      create: { name: roleName, description: def.description },
    });

    const permissions = await prisma.permission.findMany({ where: { code: { in: def.permissions } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  console.log('Sembrando usuario administrador...');
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Administrador' } });
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador del Sistema',
      username: 'admin',
      email: 'admin@empresa.com',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      active: true,
    },
  });

  const cajeroRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Facturacion/Cajero' } });
  const cajeroPasswordHash = await bcrypt.hash('Cajero123!', 10);
  await prisma.user.upsert({
    where: { username: 'cajero' },
    update: {},
    create: {
      name: 'Usuario Cajero',
      username: 'cajero',
      email: 'cajero@empresa.com',
      passwordHash: cajeroPasswordHash,
      roleId: cajeroRole.id,
      active: true,
    },
  });

  console.log('Sembrando configuracion de empresa...');
  const existingConfig = await prisma.companyConfig.findFirst();
  if (!existingConfig) {
    await prisma.companyConfig.create({
      data: {
        tradeName: 'Mi Empresa',
        legalName: 'Mi Empresa, Sociedad Anonima',
        taxId: '123456-7',
        address: 'Ciudad de Guatemala, Guatemala',
        phone: '2222-2222',
        email: 'contacto@miempresa.com',
        currency: 'GTQ',
        currencySymbol: 'Q',
        defaultTaxRate: 12,
        country: 'Guatemala',
        invoiceFormat: 'A4',
        allowOversell: false,
      },
    });
  }

  console.log('Sembrando series...');
  const series = await prisma.series.upsert({
    where: { name: 'A' },
    update: {},
    create: { name: 'A', currentNumber: 0, active: true },
  });

  console.log('Sembrando categorias...');
  const categoriasData = [
    { name: 'Abarrotes', description: 'Productos de abarrotes en general' },
    { name: 'Bebidas', description: 'Bebidas y refrescos' },
    { name: 'Limpieza', description: 'Articulos de limpieza' },
    { name: 'Servicios', description: 'Servicios prestados' },
  ];
  const categorias: Record<string, string> = {};
  for (const cat of categoriasData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categorias[cat.name] = created.id;
  }

  console.log('Sembrando productos de prueba...');
  const productosData = [
    {
      sku: 'PRD-00001',
      barcode: '7501234567001',
      name: 'Arroz 1 lb',
      categoryId: categorias.Abarrotes,
      type: 'PRODUCTO' as const,
      salePrice: 8.5,
      costPrice: 6.0,
      taxRate: 12,
      trackInventory: true,
      stock: 100,
      minStock: 15,
      unit: 'UNIDAD',
    },
    {
      sku: 'PRD-00002',
      barcode: '7501234567002',
      name: 'Frijol 1 lb',
      categoryId: categorias.Abarrotes,
      type: 'PRODUCTO' as const,
      salePrice: 9.0,
      costPrice: 6.5,
      taxRate: 12,
      trackInventory: true,
      stock: 80,
      minStock: 15,
      unit: 'UNIDAD',
    },
    {
      sku: 'PRD-00003',
      barcode: '7501234567003',
      name: 'Gaseosa 2 litros',
      categoryId: categorias.Bebidas,
      type: 'PRODUCTO' as const,
      salePrice: 15.0,
      costPrice: 10.0,
      taxRate: 12,
      trackInventory: true,
      stock: 60,
      minStock: 10,
      unit: 'UNIDAD',
    },
    {
      sku: 'PRD-00004',
      barcode: '7501234567004',
      name: 'Jabon liquido 1 litro',
      categoryId: categorias.Limpieza,
      type: 'PRODUCTO' as const,
      salePrice: 22.0,
      costPrice: 15.0,
      taxRate: 12,
      trackInventory: true,
      stock: 5,
      minStock: 10,
      unit: 'UNIDAD',
    },
    {
      sku: 'SRV-00001',
      name: 'Servicio de instalacion',
      categoryId: categorias.Servicios,
      type: 'SERVICIO' as const,
      salePrice: 150.0,
      costPrice: 0,
      taxRate: 12,
      trackInventory: false,
      stock: 0,
      minStock: 0,
      unit: 'SERVICIO',
    },
  ];
  for (const prod of productosData) {
    await prisma.product.upsert({ where: { sku: prod.sku }, update: {}, create: prod });
  }

  console.log('Sembrando clientes de prueba...');
  const clientesData = [
    {
      code: 'CLI-00001',
      name: 'Consumidor Final',
      taxId: 'CF',
      address: '',
      phone: '',
      email: '',
    },
    {
      code: 'CLI-00002',
      name: 'Comercial El Progreso, S.A.',
      taxId: '9876543-2',
      address: '5ta avenida 10-20, zona 1',
      phone: '2233-4455',
      email: 'contacto@elprogreso.com',
      contact: 'Maria Lopez',
    },
    {
      code: 'CLI-00003',
      name: 'Juan Perez',
      taxId: '1234567-8',
      address: '3ra calle 5-10, zona 2',
      phone: '5555-1234',
      email: 'juan.perez@example.com',
    },
  ];
  for (const cli of clientesData) {
    await prisma.client.upsert({ where: { code: cli.code }, update: {}, create: cli });
  }

  console.log('Listo. Serie activa:', series.name);
  console.log('\nCredenciales iniciales:');
  console.log('  Administrador -> usuario: admin      contrasena: Admin123!');
  console.log('  Cajero        -> usuario: cajero      contrasena: Cajero123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
