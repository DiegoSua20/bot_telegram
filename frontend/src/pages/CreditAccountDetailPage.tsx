import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus } from 'lucide-react';
import { creditApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';

export function CreditAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.CREDIT_MANAGE));
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('EFECTIVO');
  const [reference, setReference] = useState('');

  const { data: account, isLoading } = useQuery({
    queryKey: ['credit-account', id],
    queryFn: () => creditApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const payMutation = useMutation({
    mutationFn: () => creditApi.registerPayment(id!, { amount: Number(amount), method, reference: reference || undefined }),
    onSuccess: () => {
      toast.success('Abono registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['credit-account', id] });
      queryClient.invalidateQueries({ queryKey: ['credit-accounts'] });
      setModalOpen(false);
      setAmount('');
      setReference('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading || !account) return <p className="text-sm text-gray-500">Cargando...</p>;

  return (
    <div>
      <Link to="/cuentas-por-cobrar" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} /> Volver a cuentas por cobrar
      </Link>

      <PageHeader
        title={`Cuenta por cobrar - ${account.invoice?.fullNumber}`}
        subtitle={`Cliente: ${account.client?.name}`}
        actions={
          canManage &&
          Number(account.balance) > 0 && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Registrar abono
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-xs text-gray-500">Total factura</p>
          <p className="text-lg font-semibold">{format(account.totalAmount)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Pagado</p>
          <p className="text-lg font-semibold text-emerald-600">{format(account.paidAmount)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Saldo pendiente</p>
          <p className="text-lg font-semibold text-red-600">{format(account.balance)}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Informacion</h3>
          <StatusBadge status={account.displayStatus ?? account.status} />
        </div>
        <p className="text-sm text-gray-600">Fecha limite: {dayjs(account.dueDate).format('DD/MM/YYYY')}</p>
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Historial de abonos</h3>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(account as any).payments?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-1.5 text-left">Fecha</th>
                <th className="py-1.5 text-left">Metodo</th>
                <th className="py-1.5 text-left">Usuario</th>
                <th className="py-1.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(account as any).payments.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-1.5">{dayjs(p.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                  <td className="py-1.5">{p.method}</td>
                  <td className="py-1.5">{p.user?.name}</td>
                  <td className="py-1.5 text-right font-medium">{format(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">Aun no se han registrado abonos.</p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar abono"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={payMutation.isPending} onClick={() => payMutation.mutate()}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Monto"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={`Saldo pendiente: ${format(account.balance)}`}
          />
          <Select
            label="Metodo de pago"
            required
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: 'EFECTIVO', label: 'Efectivo' },
              { value: 'TARJETA', label: 'Tarjeta' },
              { value: 'TRANSFERENCIA', label: 'Transferencia' },
              { value: 'CHEQUE', label: 'Cheque' },
            ]}
          />
          <Input label="Referencia" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
