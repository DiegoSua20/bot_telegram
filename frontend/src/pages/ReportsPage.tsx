import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { productsApi, reportsApi } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Select, Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const REPORT_LABELS: Record<string, string> = {
  'ventas-diarias': 'Ventas diarias',
  'ventas-mensuales': 'Ventas mensuales',
  'ventas-por-rango': 'Ventas por rango de fechas',
  'ventas-por-producto': 'Ventas por producto',
  'ventas-por-categoria': 'Ventas por categoria',
  'ventas-por-cliente': 'Ventas por cliente',
  'ventas-por-usuario': 'Ventas por usuario',
  'productos-mas-vendidos': 'Productos mas vendidos',
  inventario: 'Inventario',
  'bajo-inventario': 'Bajo inventario',
  kardex: 'Kardex de producto',
  'facturas-anuladas': 'Facturas anuladas',
  'cuentas-por-cobrar': 'Cuentas por cobrar',
  'pagos-recibidos': 'Pagos recibidos',
  caja: 'Caja',
  gastos: 'Gastos',
  utilidades: 'Utilidades aproximadas',
};

export function ReportsPage() {
  const [type, setType] = useState('ventas-por-rango');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [triggered, setTriggered] = useState(false);

  const { data: types } = useQuery({ queryKey: ['report-types'], queryFn: () => reportsApi.types().then((r) => r.data) });
  const { data: productResults } = useQuery({
    queryKey: ['report-product-search', productSearch],
    queryFn: () => productsApi.search(productSearch).then((r) => r.data),
    enabled: productSearch.length > 1,
  });

  const params: Record<string, string> = { dateFrom, dateTo };
  if (type === 'kardex' && productId) params.productId = productId;

  const { data: report, isFetching, refetch } = useQuery({
    queryKey: ['report', type, params],
    queryFn: () => reportsApi.get(type, params).then((r) => r.data as { title: string; columns: { key: string; label: string }[]; rows: Record<string, unknown>[]; totals?: Record<string, unknown> }),
    enabled: false,
  });

  const handleGenerate = () => {
    if (type === 'kardex' && !productId) {
      return;
    }
    setTriggered(true);
    refetch();
  };

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Genere y exporte reportes del negocio" />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Tipo de reporte"
            className="min-w-[220px]"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setTriggered(false);
            }}
            options={(types ?? Object.keys(REPORT_LABELS)).map((t) => ({ value: t, label: REPORT_LABELS[t] ?? t }))}
          />
          {type !== 'inventario' && type !== 'bajo-inventario' && type !== 'cuentas-por-cobrar' && (
            <>
              <Input label="Desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input label="Hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </>
          )}
          {type === 'kardex' && (
            <div className="relative min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-gray-700">Producto</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <Input className="pl-9" placeholder="Buscar producto" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              </div>
              {productResults && productResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setProductId(p.id);
                        setProductSearch(p.name);
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button onClick={handleGenerate} loading={isFetching}>
            Generar
          </Button>
          {triggered && report && (
            <>
              <a href={reportsApi.exportUrl(type, 'xlsx', params)}>
                <Button variant="secondary">
                  <FileSpreadsheet size={16} /> Excel
                </Button>
              </a>
              <a href={reportsApi.exportUrl(type, 'pdf', params)}>
                <Button variant="secondary">
                  <Download size={16} /> PDF
                </Button>
              </a>
            </>
          )}
        </div>
      </Card>

      {triggered && report && (
        <Card className="mt-4 overflow-x-auto">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{report.title}</h3>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {report.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.rows.length === 0 && (
                <tr>
                  <td colSpan={report.columns.length} className="px-3 py-8 text-center text-gray-400">
                    Sin datos para los filtros seleccionados
                  </td>
                </tr>
              )}
              {report.rows.map((row, idx) => (
                <tr key={idx}>
                  {report.columns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-3 py-2 text-gray-700">
                      {String(row[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
