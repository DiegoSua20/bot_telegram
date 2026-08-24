import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/Badge';
import { invoicesApi } from '../api/endpoints';
import { Invoice } from '../types';
import { useCurrency } from '../hooks/useCurrency';

export function InvoicesPage() {
  const { format } = useCurrency();
  const [filters, setFilters] = useState({
    fullNumber: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    paymentMethod: '',
  });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters, page],
    queryFn: () => invoicesApi.list({ ...filters, page: String(page), pageSize: '15' }).then((r) => r.data),
  });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'fullNumber',
      header: 'Numero',
      render: (inv) => (
        <Link to={`/facturas/${inv.id}`} className="font-medium text-brand-600 hover:underline">
          {inv.fullNumber}
        </Link>
      ),
    },
    { key: 'date', header: 'Fecha', render: (inv) => dayjs(inv.createdAt).format('DD/MM/YYYY HH:mm') },
    { key: 'client', header: 'Cliente', render: (inv) => inv.client?.name },
    { key: 'user', header: 'Usuario', render: (inv) => inv.user?.name },
    { key: 'total', header: 'Total', render: (inv) => format(inv.total) },
    { key: 'method', header: 'Metodo de pago', render: (inv) => inv.paymentMethod },
    { key: 'status', header: 'Estado', render: (inv) => <StatusBadge status={inv.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Facturas" subtitle="Historial de facturas emitidas" />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Numero de factura" className="max-w-[180px]" value={filters.fullNumber} onChange={(e) => setFilter('fullNumber', e.target.value)} />
        <Input type="date" className="max-w-[160px]" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} />
        <Input type="date" className="max-w-[160px]" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} />
        <Select
          className="max-w-[160px]"
          placeholder="Todos los estados"
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          options={[
            { value: 'EMITIDA', label: 'Emitida' },
            { value: 'PAGADA', label: 'Pagada' },
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'PARCIAL', label: 'Parcial' },
            { value: 'ANULADA', label: 'Anulada' },
          ]}
        />
        <Select
          className="max-w-[170px]"
          placeholder="Todos los metodos"
          value={filters.paymentMethod}
          onChange={(e) => setFilter('paymentMethod', e.target.value)}
          options={[
            { value: 'EFECTIVO', label: 'Efectivo' },
            { value: 'TARJETA', label: 'Tarjeta' },
            { value: 'TRANSFERENCIA', label: 'Transferencia' },
            { value: 'CHEQUE', label: 'Cheque' },
            { value: 'CREDITO', label: 'Credito' },
            { value: 'COMBINADO', label: 'Combinado' },
          ]}
        />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(i) => i.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
