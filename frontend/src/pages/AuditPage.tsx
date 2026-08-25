import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { auditApi } from '../api/endpoints';
import { AuditLog } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';

const MODULES = [
  'auth',
  'users',
  'roles',
  'clients',
  'categories',
  'products',
  'inventory',
  'series',
  'invoices',
  'credit',
  'cash',
  'expenses',
  'company',
];

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red' | 'yellow' | 'gray'> = {
  CREATE: 'green',
  UPDATE: 'blue',
  LOGIN: 'gray',
  VOID: 'red',
  DEACTIVATE: 'yellow',
  ACTIVATE: 'green',
};

export function AuditPage() {
  const [module, setModule] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', module, dateFrom, dateTo, page],
    queryFn: () => auditApi.list({ module, dateFrom, dateTo, page: String(page), pageSize: '20' }).then((r) => r.data),
  });

  const columns: Column<AuditLog>[] = [
    { key: 'date', header: 'Fecha', render: (a) => dayjs(a.createdAt).format('DD/MM/YYYY HH:mm:ss') },
    { key: 'user', header: 'Usuario', render: (a) => a.user?.name ?? 'Sistema' },
    { key: 'module', header: 'Modulo', render: (a) => a.module },
    { key: 'action', header: 'Accion', render: (a) => <Badge tone={ACTION_TONE[a.action] ?? 'gray'}>{a.action}</Badge> },
    { key: 'record', header: 'Registro', render: (a) => a.recordId?.slice(0, 8) ?? '-' },
  ];

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Registro de operaciones importantes del sistema" />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          className="max-w-[180px]"
          placeholder="Todos los modulos"
          value={module}
          onChange={(e) => {
            setPage(1);
            setModule(e.target.value);
          }}
          options={MODULES.map((m) => ({ value: m, label: m }))}
        />
        <Input type="date" className="max-w-[160px]" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
        <Input type="date" className="max-w-[160px]" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(a) => a.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
