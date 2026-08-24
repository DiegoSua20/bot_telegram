import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { expensesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Expense } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';
import { useCurrency } from '../hooks/useCurrency';

const emptyForm = {
  date: dayjs().format('YYYY-MM-DD'),
  category: '',
  description: '',
  amount: '',
  paymentMethod: 'EFECTIVO',
  referenceDoc: '',
};

export function ExpensesPage() {
  const { format } = useCurrency();
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.EXPENSES_MANAGE));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo, page],
    queryFn: () => expensesApi.list({ dateFrom, dateTo, page: String(page), pageSize: '15' }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => expensesApi.create({ ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      toast.success('Gasto registrado');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setModalOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Fecha', render: (e) => dayjs(e.date).format('DD/MM/YYYY') },
    { key: 'category', header: 'Categoria', render: (e) => e.category },
    { key: 'description', header: 'Descripcion', render: (e) => e.description },
    { key: 'amount', header: 'Monto', render: (e) => format(e.amount) },
    { key: 'method', header: 'Metodo de pago', render: (e) => e.paymentMethod },
    { key: 'user', header: 'Usuario', render: (e) => e.user?.name ?? '-' },
    { key: 'reference', header: 'Referencia', render: (e) => e.referenceDoc || '-' },
  ];

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Registro de gastos del negocio"
        actions={
          canManage && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Registrar gasto
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input type="date" className="max-w-[160px]" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
        <Input type="date" className="max-w-[160px]" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(e) => e.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar gasto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Categoria" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="col-span-2">
            <Input label="Descripcion" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Input label="Monto" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select
            label="Metodo de pago"
            required
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            options={[
              { value: 'EFECTIVO', label: 'Efectivo' },
              { value: 'TARJETA', label: 'Tarjeta' },
              { value: 'TRANSFERENCIA', label: 'Transferencia' },
              { value: 'CHEQUE', label: 'Cheque' },
            ]}
          />
          <div className="col-span-2">
            <Input label="Documento de referencia" value={form.referenceDoc} onChange={(e) => setForm({ ...form, referenceDoc: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
