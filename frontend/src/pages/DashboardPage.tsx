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

export function DashboardPage() {
  const { format } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500">Cargando dashboard...</p>;
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Ventas ultimos 14 dias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.salesChart}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => dayjs(v).format('DD/MM')}
                fontSize={11}
                stroke="#9ca3af"
              />
              <YAxis fontSize={11} stroke="#9ca3af" width={70} tickFormatter={(v) => format(v)} />
              <Tooltip
                formatter={(v) => format(Number(v))}
                labelFormatter={(v) => dayjs(v as string).format('DD/MM/YYYY')}
              />
              <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#salesGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Productos con bajo inventario</h3>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No hay productos con bajo inventario.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockProducts.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-gray-700">{p.name}</span>
                  <span className="font-medium text-red-600">
                    {Number(p.stock)} / {Number(p.minStock)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Productos mas vendidos (mes)</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas registradas este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.topProducts.slice(0, 8).map((p) => (
                  <tr key={p.productId} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 text-gray-700">{p.name}</td>
                    <td className="py-1.5 text-right text-gray-500">{p.quantity} uds</td>
                    <td className="py-1.5 text-right font-medium text-gray-800">{format(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Ultimas facturas</h3>
            <Link to="/facturas" className="text-xs text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {data.latestInvoices.length === 0 ? (
            <p className="text-sm text-gray-400">Aun no hay facturas.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.latestInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5">
                      <Link to={`/facturas/${inv.id}`} className="text-brand-600 hover:underline">
                        {inv.fullNumber}
                      </Link>
                    </td>
                    <td className="py-1.5 text-gray-600">{inv.client?.name}</td>
                    <td className="py-1.5 text-right font-medium">{format(inv.total)}</td>
                    <td className="py-1.5 text-right">
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
