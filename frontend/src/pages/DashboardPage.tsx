import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';
import { DollarSign, FileText, XCircle, Wallet, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import { StatCard, Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/Badge';
import { useCurrency } from '../hooks/useCurrency';
import { Link } from 'react-router-dom';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 font-display text-sm font-bold text-slate-800">{children}</h3>;
}

export function DashboardPage() {
  const { format } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Cargando dashboard...
        </span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general del negocio" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas de hoy" value={format(data.salesToday)} icon={<DollarSign size={20} />} tone="brand" />
        <StatCard label="Ventas del mes" value={format(data.salesMonth)} icon={<TrendingUp size={20} />} tone="green" />
        <StatCard label="Facturas emitidas hoy" value={data.invoicesIssuedToday} icon={<FileText size={20} />} tone="purple" />
        <StatCard label="Facturas anuladas hoy" value={data.invoicesVoidedToday} icon={<XCircle size={20} />} tone="red" />
        <StatCard label="Cobrado hoy" value={format(data.totalCollectedToday)} icon={<Wallet size={20} />} tone="green" />
        <StatCard label="Total pendiente de cobro" value={format(data.totalPending)} icon={<Wallet size={20} />} tone="amber" />
        <StatCard label="Clientes registrados" value={data.clientsRegistered} icon={<Users size={20} />} tone="brand" />
        <StatCard label="Productos con bajo inventario" value={data.lowStockCount} icon={<AlertTriangle size={20} />} tone="red" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>Ventas ultimos 14 dias</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.salesChart}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => dayjs(v).format('DD/MM')}
                fontSize={11}
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={11} stroke="#94a3b8" width={70} tickFormatter={(v) => format(v)} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v) => format(Number(v))}
                labelFormatter={(v) => dayjs(v as string).format('DD/MM/YYYY')}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }}
              />
              <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="url(#salesGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Productos con bajo inventario</SectionTitle>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No hay productos con bajo inventario.</p>
          ) : (
            <ul className="space-y-1">
              {data.lowStockProducts.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50">
                  <span className="truncate text-slate-600">{p.name}</span>
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                    {Number(p.stock)} / {Number(p.minStock)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle>Productos mas vendidos (mes)</SectionTitle>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Sin ventas registradas este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.topProducts.slice(0, 8).map((p) => (
                  <tr key={p.productId} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 text-slate-700">{p.name}</td>
                    <td className="py-2 text-right text-slate-400">{p.quantity} uds</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{format(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Ultimas facturas</SectionTitle>
            <Link to="/facturas" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Ver todas
            </Link>
          </div>
          {data.latestInvoices.length === 0 ? (
            <p className="text-sm text-slate-400">Aun no hay facturas.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.latestInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2">
                      <Link to={`/facturas/${inv.id}`} className="font-semibold text-brand-600 hover:underline">
                        {inv.fullNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-600">{inv.client?.name}</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{format(inv.total)}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
