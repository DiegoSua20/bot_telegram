import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Package,
  Boxes,
  Landmark,
  Wallet,
  BadgeDollarSign,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Tags,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useCompanyStore } from '../../store/companyStore';
import { PERMISSIONS } from '../../constants/permissions';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permissions?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { to: '/facturacion', label: 'Facturacion', icon: Receipt, permissions: [PERMISSIONS.INVOICES_CREATE] },
  { to: '/facturas', label: 'Facturas', icon: FileText, permissions: [PERMISSIONS.INVOICES_VIEW] },
  { to: '/clientes', label: 'Clientes', icon: Users, permissions: [PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE] },
  { to: '/productos', label: 'Productos', icon: Package, permissions: [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_MANAGE] },
  { to: '/categorias', label: 'Categorias', icon: Tags, permissions: [PERMISSIONS.CATEGORIES_MANAGE] },
  { to: '/inventario', label: 'Inventario', icon: Boxes, permissions: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE] },
  { to: '/cuentas-por-cobrar', label: 'Cuentas por cobrar', icon: Landmark, permissions: [PERMISSIONS.CREDIT_VIEW, PERMISSIONS.CREDIT_MANAGE] },
  { to: '/caja', label: 'Caja', icon: Wallet, permissions: [PERMISSIONS.CASH_VIEW, PERMISSIONS.CASH_MANAGE] },
  { to: '/gastos', label: 'Gastos', icon: BadgeDollarSign, permissions: [PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_MANAGE] },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, permissions: [PERMISSIONS.REPORTS_VIEW] },
  { to: '/usuarios', label: 'Usuarios y roles', icon: UserCog, permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE] },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck, permissions: [PERMISSIONS.AUDIT_VIEW] },
  { to: '/configuracion', label: 'Configuracion', icon: Settings, permissions: [PERMISSIONS.COMPANY_MANAGE] },
];

export function Sidebar({ open }: { open: boolean }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const config = useCompanyStore((s) => s.config);

  const items = NAV_ITEMS.filter((item) => !item.permissions || hasPermission(...item.permissions));

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        {config?.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
            {config?.tradeName?.charAt(0) ?? 'F'}
          </div>
        )}
        <span className="truncate text-sm font-semibold text-gray-800">{config?.tradeName ?? 'Facturacion'}</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
