import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Ban } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { invoicesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Invoice } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';

export function InvoicesPage() {
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const canVoid = useAuthStore((s) => s.hasPermission(PERMISSIONS.INVOICES_VOID));
  const [filters, setFilters] = useState({
    fullNumber: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    paymentMethod: '',
  });
  const [page, setPage] = useState(1);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters, page],
    queryFn: () => invoicesApi.list({ ...filters, page: String(page), pageSize: '15' }).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => invoicesApi.cancel(invoiceToCancel!.id, reason),
    onSuccess: () => {
      toast.success(`Factura ${invoiceToCancel?.fullNumber} anulada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceToCancel?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setInvoiceToCancel(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (inv) =>
        canVoid && inv.status !== 'ANULADA' ? (
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            onClick={() => setInvoiceToCancel(inv)}
            title="Anular esta factura"
          >
            <Ban size={14} /> Anular
          </button>
        ) : null,
    },
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

      <ConfirmDialog
        open={!!invoiceToCancel}
        options={
          invoiceToCancel && {
            title: 'Anular factura',
            message: `Esta accion anulara la factura ${invoiceToCancel.fullNumber} (${format(invoiceToCancel.total)}) y reintegrara las existencias vendidas. Esta accion no se puede deshacer.`,
            requireReason: true,
            reasonLabel: 'Motivo de anulacion',
            danger: true,
            confirmLabel: 'Anular factura',
          }
        }
        onCancel={() => setInvoiceToCancel(null)}
        onConfirm={(reason) => cancelMutation.mutate(reason ?? '')}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
