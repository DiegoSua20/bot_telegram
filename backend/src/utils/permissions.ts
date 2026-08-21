export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',

  CLIENTS_VIEW: 'clients.view',
  CLIENTS_MANAGE: 'clients.manage',

  CATEGORIES_MANAGE: 'categories.manage',

  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',

  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_VOID: 'invoices.void',

  CREDIT_VIEW: 'credit.view',
  CREDIT_MANAGE: 'credit.manage',

  CASH_VIEW: 'cash.view',
  CASH_MANAGE: 'cash.manage',

  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_MANAGE: 'expenses.manage',

  REPORTS_VIEW: 'reports.view',

  COMPANY_MANAGE: 'company.manage',
  SERIES_MANAGE: 'series.manage',

  AUDIT_VIEW: 'audit.view',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LIST: { code: PermissionCode; module: string; description: string }[] = [
  { code: PERMISSIONS.DASHBOARD_VIEW, module: 'dashboard', description: 'Ver dashboard' },
  { code: PERMISSIONS.USERS_VIEW, module: 'users', description: 'Ver usuarios' },
  { code: PERMISSIONS.USERS_MANAGE, module: 'users', description: 'Crear/editar/activar usuarios' },
  { code: PERMISSIONS.ROLES_MANAGE, module: 'roles', description: 'Administrar roles y permisos' },
  { code: PERMISSIONS.CLIENTS_VIEW, module: 'clients', description: 'Ver clientes' },
  { code: PERMISSIONS.CLIENTS_MANAGE, module: 'clients', description: 'Crear/editar clientes' },
  { code: PERMISSIONS.CATEGORIES_MANAGE, module: 'categories', description: 'Administrar categorias' },
  { code: PERMISSIONS.PRODUCTS_VIEW, module: 'products', description: 'Ver productos' },
  { code: PERMISSIONS.PRODUCTS_MANAGE, module: 'products', description: 'Crear/editar productos' },
  { code: PERMISSIONS.INVENTORY_VIEW, module: 'inventory', description: 'Ver inventario/kardex' },
  { code: PERMISSIONS.INVENTORY_MANAGE, module: 'inventory', description: 'Registrar movimientos de inventario' },
  { code: PERMISSIONS.INVOICES_VIEW, module: 'invoices', description: 'Ver facturas' },
  { code: PERMISSIONS.INVOICES_CREATE, module: 'invoices', description: 'Crear facturas' },
  { code: PERMISSIONS.INVOICES_VOID, module: 'invoices', description: 'Anular facturas' },
  { code: PERMISSIONS.CREDIT_VIEW, module: 'credit', description: 'Ver cuentas por cobrar' },
  { code: PERMISSIONS.CREDIT_MANAGE, module: 'credit', description: 'Registrar abonos' },
  { code: PERMISSIONS.CASH_VIEW, module: 'cash', description: 'Ver caja' },
  { code: PERMISSIONS.CASH_MANAGE, module: 'cash', description: 'Abrir/cerrar caja' },
  { code: PERMISSIONS.EXPENSES_VIEW, module: 'expenses', description: 'Ver gastos' },
  { code: PERMISSIONS.EXPENSES_MANAGE, module: 'expenses', description: 'Registrar gastos' },
  { code: PERMISSIONS.REPORTS_VIEW, module: 'reports', description: 'Ver y exportar reportes' },
  { code: PERMISSIONS.COMPANY_MANAGE, module: 'company', description: 'Configurar empresa' },
  { code: PERMISSIONS.SERIES_MANAGE, module: 'series', description: 'Administrar series/correlativos' },
  { code: PERMISSIONS.AUDIT_VIEW, module: 'audit', description: 'Ver auditoria' },
];

export const ROLE_DEFINITIONS: Record<string, { description: string; permissions: PermissionCode[] }> = {
  Administrador: {
    description: 'Acceso total al sistema',
    permissions: PERMISSION_LIST.map((p) => p.code),
  },
  'Facturacion/Cajero': {
    description: 'Punto de venta, facturacion y caja',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.CLIENTS_MANAGE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.INVOICES_CREATE,
      PERMISSIONS.CREDIT_VIEW,
      PERMISSIONS.CREDIT_MANAGE,
      PERMISSIONS.CASH_VIEW,
      PERMISSIONS.CASH_MANAGE,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
    ],
  },
  Supervisor: {
    description: 'Supervision general, anulaciones e inventario',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.CLIENTS_MANAGE,
      PERMISSIONS.CATEGORIES_MANAGE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.INVOICES_CREATE,
      PERMISSIONS.INVOICES_VOID,
      PERMISSIONS.CREDIT_VIEW,
      PERMISSIONS.CREDIT_MANAGE,
      PERMISSIONS.CASH_VIEW,
      PERMISSIONS.CASH_MANAGE,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.SERIES_MANAGE,
    ],
  },
  Contabilidad: {
    description: 'Reportes, cuentas por cobrar, gastos y auditoria',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.CREDIT_VIEW,
      PERMISSIONS.CREDIT_MANAGE,
      PERMISSIONS.CASH_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
};
