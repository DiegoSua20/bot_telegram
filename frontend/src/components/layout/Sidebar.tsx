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

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: [PERMISSIONS.DASHBOARD_VIEW] }],
  },
  {
    label: 'Ventas',
    items: [
      { to: '/facturacion', label: 'Facturacion', icon: Receipt, permissions: [PERMISSIONS.INVOICES_CREATE] },
      { to: '/facturas', label: 'Facturas', icon: FileText, permissions: [PERMISSIONS.INVOICES_VIEW] },
      { to: '/clientes', label: 'Clientes', icon: Users, permissions: [PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE] },
      { to: '/cuentas-por-cobrar', label: 'Cuentas por cobrar', icon: Landmark, permissions: [PERMISSIONS.CREDIT_VIEW, PERMISSIONS.CREDIT_MANAGE] },
    ],
  },
  {
    label: 'Operacion',
    items: [
      { to: '/productos', label: 'Productos', icon: Package, permissions: [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_MANAGE] },
      { to: '/categorias', label: 'Categorias', icon: Tags, permissions: [PERMISSIONS.CATEGORIES_MANAGE] },
      { to: '/inventario', label: 'Inventario', icon: Boxes, permissions: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE] },
      { to: '/caja', label: 'Caja', icon: Wallet, permissions: [PERMISSIONS.CASH_VIEW, PERMISSIONS.CASH_MANAGE] },
      { to: '/gastos', label: 'Gastos', icon: BadgeDollarSign, permissions: [PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_MANAGE] },
    ],
  },
  {
    label: 'Administracion',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3, permissions: [PERMISSIONS.REPORTS_VIEW] },
      { to: '/usuarios', label: 'Usuarios y roles', icon: UserCog, permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE] },
      { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck, permissions: [PERMISSIONS.AUDIT_VIEW] },
      { to: '/configuracion', label: 'Configuracion', icon: Settings, permissions: [PERMISSIONS.COMPANY_MANAGE] },
    ],
  },
];

export function Sidebar({ open }: { open: boolean }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const config = useCompanyStore((s) => s.config);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permissions || hasPermission(...item.permissions)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-ink-900 via-ink-900 to-brand-950 text-slate-300 transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
        {config?.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="h-9 w-9 rounded-lg object-contain ring-1 ring-white/10" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-900/50">
            {config?.tradeName?.charAt(0) ?? 'F'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{config?.tradeName ?? 'Facturacion'}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">Sistema ERP</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white shadow-inner shadow-black/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={17} className={isActive ? 'text-brand-400' : 'text-slate-500'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/5 px-5 py-3">
        <p className="text-[10px] font-medium text-slate-500">Facturacion Pro &copy; {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
