import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Lock, Unlock, Plus, Minus } from 'lucide-react';
import { cashApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';
import { CashSession } from '../types';

export function CashPage() {
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.CASH_MANAGE));
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [movementModal, setMovementModal] = useState<'INGRESO' | 'EGRESO' | null>(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [notes, setNotes] = useState('');

  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-current'],
    queryFn: () => cashApi.current().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['cash-summary', session?.id],
    queryFn: () => cashApi.summary(session!.id).then((r) => r.data),
    enabled: !!session?.id,
  });

  const { data: history } = useQuery({
    queryKey: ['cash-sessions'],
    queryFn: () => cashApi.list({ pageSize: '10' }).then((r) => r.data),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cash-current'] });
    queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
    queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
  };

  const openMutation = useMutation({
    mutationFn: () => cashApi.open(Number(openingAmount), notes || undefined),
    onSuccess: () => {
      toast.success('Caja abierta correctamente');
      invalidateAll();
      setOpenModal(false);
      setOpeningAmount('');
      setNotes('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: () => cashApi.close(session!.id, Number(declaredAmount), notes || undefined),
    onSuccess: () => {
      toast.success('Caja cerrada correctamente');
      invalidateAll();
      setCloseModal(false);
      setDeclaredAmount('');
      setNotes('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const movementMutation = useMutation({
    mutationFn: () =>
      cashApi.manualMovement(session!.id, { type: movementModal, amount: Number(movementAmount), description: movementDescription }),
    onSuccess: () => {
      toast.success('Movimiento registrado');
      invalidateAll();
      setMovementModal(null);
      setMovementAmount('');
      setMovementDescription('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: Column<CashSession>[] = [
    { key: 'user', header: 'Usuario', render: (s) => s.user?.name ?? '-' },
    { key: 'opened', header: 'Apertura', render: (s) => dayjs(s.openedAt).format('DD/MM/YYYY HH:mm') },
    { key: 'closed', header: 'Cierre', render: (s) => (s.closedAt ? dayjs(s.closedAt).format('DD/MM/YYYY HH:mm') : '-') },
    { key: 'opening', header: 'Monto inicial', render: (s) => format(s.openingAmount) },
    { key: 'expected', header: 'Esperado', render: (s) => (s.expectedAmount !== null && s.expectedAmount !== undefined ? format(s.expectedAmount) : '-') },
    { key: 'declared', header: 'Declarado', render: (s) => (s.declaredAmount !== null && s.declaredAmount !== undefined ? format(s.declaredAmount) : '-') },
    {
      key: 'difference',
      header: 'Diferencia',
      render: (s) =>
        s.difference !== null && s.difference !== undefined ? (
          <span className={Number(s.difference) < 0 ? 'text-red-600' : Number(s.difference) > 0 ? 'text-emerald-600' : ''}>
            {format(s.difference)}
          </span>
        ) : (
          '-'
        ),
    },
    { key: 'status', header: 'Estado', render: (s) => <Badge tone={s.status === 'ABIERTA' ? 'green' : 'gray'}>{s.status}</Badge> },
  ];

  if (isLoading) return <p className="text-sm text-gray-500">Cargando...</p>;

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle="Apertura, movimientos y cierre de caja"
        actions={
          canManage &&
          (session ? (
            <Button variant="danger" onClick={() => setCloseModal(true)}>
              <Lock size={16} /> Cerrar caja
            </Button>
          ) : (
            <Button onClick={() => setOpenModal(true)}>
              <Unlock size={16} /> Abrir caja
            </Button>
          ))
        }
      />

      {session ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-gray-500">Monto inicial</p>
              <p className="text-lg font-semibold">{format(session.openingAmount)}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Ventas en efectivo</p>
              <p className="text-lg font-semibold text-emerald-600">{format(summary?.totals?.VENTA_EFECTIVO ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Ventas tarjeta / transferencia</p>
              <p className="text-lg font-semibold">
                {format((summary?.totals?.VENTA_TARJETA ?? 0) + (summary?.totals?.VENTA_TRANSFERENCIA ?? 0) + (summary?.totals?.VENTA_CHEQUE ?? 0))}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Efectivo esperado en caja</p>
              <p className="text-lg font-semibold">{format(summary?.expectedCash ?? 0)}</p>
            </Card>
          </div>

          {canManage && (
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMovementModal('INGRESO')}>
                <Plus size={14} /> Registrar ingreso
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setMovementModal('EGRESO')}>
                <Minus size={14} /> Registrar egreso
              </Button>
            </div>
          )}

          <Card className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Movimientos de la sesion</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-1.5 text-left">Hora</th>
                  <th className="py-1.5 text-left">Tipo</th>
                  <th className="py-1.5 text-left">Descripcion</th>
                  <th className="py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(summary?.session as any)?.movements?.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-1.5">{dayjs(m.createdAt).format('HH:mm')}</td>
                    <td className="py-1.5">{m.type}</td>
                    <td className="py-1.5">{m.description ?? '-'}</td>
                    <td className={`py-1.5 text-right font-medium ${Number(m.amount) < 0 ? 'text-red-600' : ''}`}>{format(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-gray-500">No tiene una caja abierta actualmente.</p>
        </Card>
      )}

      <Card className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Historial de sesiones</h3>
        <Table columns={columns} data={history?.items ?? []} rowKey={(s) => s.id} />
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Abrir caja"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancelar
            </Button>
            <Button loading={openMutation.isPending} onClick={() => openMutation.mutate()}>
              Abrir
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Monto inicial" type="number" step="0.01" required value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
          <Input label="Observaciones" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={closeModal}
        onClose={() => setCloseModal(false)}
        title="Cerrar caja"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Cerrar caja
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Efectivo esperado: {format(summary?.expectedCash ?? 0)}
          </p>
          <Input label="Monto declarado (efectivo contado)" type="number" step="0.01" required value={declaredAmount} onChange={(e) => setDeclaredAmount(e.target.value)} />
          <Input label="Observaciones" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={!!movementModal}
        onClose={() => setMovementModal(null)}
        title={movementModal === 'INGRESO' ? 'Registrar ingreso' : 'Registrar egreso'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMovementModal(null)}>
              Cancelar
            </Button>
            <Button loading={movementMutation.isPending} onClick={() => movementMutation.mutate()}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Monto" type="number" step="0.01" required value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} />
          <Input label="Descripcion" required value={movementDescription} onChange={(e) => setMovementDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
