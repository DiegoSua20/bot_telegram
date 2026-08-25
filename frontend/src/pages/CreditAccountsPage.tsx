import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/Badge';
import { creditApi } from '../api/endpoints';
import { CreditAccount } from '../types';
import { useCurrency } from '../hooks/useCurrency';

export function CreditAccountsPage() {
  const { format } = useCurrency();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['credit-accounts', status, page],
    queryFn: () => creditApi.list({ status, page: String(page), pageSize: '15' }).then((r) => r.data),
  });

  const columns: Column<CreditAccount>[] = [
    {
      key: 'invoice',
      header: 'Factura',
      render: (a) => (
        <Link to={`/cuentas-por-cobrar/${a.id}`} className="font-medium text-brand-600 hover:underline">
          {a.invoice?.fullNumber}
        </Link>
      ),
    },
    { key: 'client', header: 'Cliente', render: (a) => a.client?.name },
    { key: 'total', header: 'Total', render: (a) => format(a.totalAmount) },
    { key: 'paid', header: 'Pagado', render: (a) => format(a.paidAmount) },
    { key: 'balance', header: 'Saldo', render: (a) => format(a.balance) },
    { key: 'dueDate', header: 'Vencimiento', render: (a) => dayjs(a.dueDate).format('DD/MM/YYYY') },
    { key: 'status', header: 'Estado', render: (a) => <StatusBadge status={a.displayStatus ?? a.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Cuentas por cobrar" subtitle="Ventas al credito y su estado de cobro" />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          className="max-w-[180px]"
          placeholder="Todos los estados"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          options={[
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'PARCIAL', label: 'Parcial' },
            { value: 'PAGADO', label: 'Pagado' },
            { value: 'VENCIDO', label: 'Vencido' },
          ]}
        />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(a) => a.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
