import { ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Lock, Unlock, Plus, Minus, Eye, Banknote, Coins } from 'lucide-react';
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
import { DENOMINATIONS } from '../constants/denominations';
import { CashSession } from '../types';

const MOVEMENT_LABELS: Record<string, string> = {
  VENTA_EFECTIVO: 'Ventas en efectivo',
  VENTA_TARJETA: 'Ventas con tarjeta',
  VENTA_TRANSFERENCIA: 'Ventas por transferencia',
  VENTA_CHEQUE: 'Ventas con cheque',
  VENTA_OTRO: 'Ventas otros metodos',
  INGRESO: 'Ingresos manuales',
  EGRESO: 'Egresos manuales',
  GASTO: 'Gastos pagados en efectivo',
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function DenominationTable({
  rows,
  icon,
  title,
  counts,
  symbol,
  format,
  onChangeCount,
}: {
  rows: typeof DENOMINATIONS;
  icon: ReactNode;
  title: string;
  counts: Record<number, string>;
  symbol: string;
  format: (value: string | number) => string;
  onChangeCount: (denomination: number, value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {icon} {title}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Denominacion</th>
              <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Cantidad</th>
              <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => {
              const qty = Number(counts[d.value]) || 0;
              return (
                <tr key={d.value}>
                  <td className="px-3 py-1.5 font-medium text-slate-700">
                    {symbol}
                    {d.value < 1 ? d.value.toFixed(2) : d.value}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                      value={counts[d.value] ?? ''}
                      placeholder="0"
                      onChange={(e) => onChangeCount(d.value, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{format(round2(d.value * qty))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CashPage() {
  const { format, symbol } = useCurrency();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.CASH_MANAGE));
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [movementModal, setMovementModal] = useState<'INGRESO' | 'EGRESO' | null>(null);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [counts, setCounts] = useState<Record<number, string>>({});

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

  const { data: detail } = useQuery({
    queryKey: ['cash-summary-detail', detailSessionId],
    queryFn: () => cashApi.summary(detailSessionId!).then((r) => r.data),
    enabled: !!detailSessionId,
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

  const countedTotal = useMemo(
    () => round2(DENOMINATIONS.reduce((acc, d) => acc + d.value * (Number(counts[d.value]) || 0), 0)),
    [counts],
  );
  const expectedCash = summary?.expectedCash ?? 0;
  const closeDifference = round2(countedTotal - expectedCash);

  const closeMutation = useMutation({
    mutationFn: () =>
      cashApi.close(
        session!.id,
        DENOMINATIONS.map((d) => ({ denomination: d.value, quantity: Number(counts[d.value]) || 0 })),
        closeNotes || undefined,
      ),
    onSuccess: (res) => {
      toast.success('Caja cerrada correctamente');
      invalidateAll();
      setCloseModal(false);
      setCounts({});
      setCloseNotes('');
      setDetailSessionId(res.data.id);
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
          <span className={Number(s.difference) < 0 ? 'font-semibold text-rose-600' : Number(s.difference) > 0 ? 'font-semibold text-emerald-600' : 'text-slate-500'}>
            {format(s.difference)}
          </span>
        ) : (
          '-'
        ),
    },
    { key: 'status', header: 'Estado', render: (s) => <Badge tone={s.status === 'ABIERTA' ? 'green' : 'gray'}>{s.status}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) => (
        <button
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
          onClick={() => setDetailSessionId(s.id)}
        >
          <Eye size={14} /> Ver detalle
        </button>
      ),
    },
  ];

  const bills = DENOMINATIONS.filter((d) => d.kind === 'billete');
  const coins = DENOMINATIONS.filter((d) => d.kind === 'moneda');
  const handleChangeCount = (denomination: number, value: string) =>
    setCounts((prev) => ({ ...prev, [denomination]: value }));

  if (isLoading) return <p className="text-sm text-slate-500">Cargando...</p>;

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle="Apertura, movimientos y cierre de caja"
        actions={
          canManage &&
          (session ? (
            <Button variant="danger" onClick={() => setCloseModal(true)}>
              <Lock size={16} /> Cierre de caja
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
              <p className="text-xs text-slate-500">Monto inicial</p>
              <p className="text-lg font-semibold">{format(session.openingAmount)}</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Ventas en efectivo</p>
              <p className="text-lg font-semibold text-emerald-600">{format(summary?.totals?.VENTA_EFECTIVO ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Ventas tarjeta / transferencia</p>
              <p className="text-lg font-semibold">
                {format((summary?.totals?.VENTA_TARJETA ?? 0) + (summary?.totals?.VENTA_TRANSFERENCIA ?? 0) + (summary?.totals?.VENTA_CHEQUE ?? 0))}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Efectivo esperado en caja</p>
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
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Movimientos de la sesion</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-1.5 text-left">Hora</th>
                  <th className="py-1.5 text-left">Tipo</th>
                  <th className="py-1.5 text-left">Descripcion</th>
                  <th className="py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {summary?.session.movements?.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-1.5">{dayjs(m.createdAt).format('HH:mm')}</td>
                    <td className="py-1.5">{m.type}</td>
                    <td className="py-1.5">{m.description ?? '-'}</td>
                    <td className={`py-1.5 text-right font-medium ${Number(m.amount) < 0 ? 'text-rose-600' : ''}`}>{format(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">No tiene una caja abierta actualmente.</p>
        </Card>
      )}

      <Card className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Historial de sesiones</h3>
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
        title="Cierre de caja"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Confirmar cierre de caja
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Monto inicial</p>
              <p className="mt-1 font-display text-lg font-bold text-slate-800">{format(session?.openingAmount ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Efectivo esperado</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-700">{format(expectedCash)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${closeDifference === 0 ? 'bg-slate-50' : closeDifference > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <p className={`text-[11px] font-bold uppercase tracking-wide ${closeDifference === 0 ? 'text-slate-500' : closeDifference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Diferencia
              </p>
              <p className={`mt-1 font-display text-lg font-bold ${closeDifference === 0 ? 'text-slate-800' : closeDifference > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {closeDifference > 0 ? 'Sobrante ' : closeDifference < 0 ? 'Faltante ' : ''}
                {format(Math.abs(closeDifference))}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Ventas del turno por metodo de pago</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl border border-slate-100 p-3 text-sm sm:grid-cols-3">
              {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-800">{format(summary?.totals?.[key] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Conteo de efectivo (arqueo)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DenominationTable rows={bills} icon={<Banknote size={14} />} title="Billetes" counts={counts} symbol={symbol} format={format} onChangeCount={handleChangeCount} />
              <DenominationTable rows={coins} icon={<Coins size={14} />} title="Monedas" counts={counts} symbol={symbol} format={format} onChangeCount={handleChangeCount} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
              <span className="text-sm font-semibold text-slate-300">Total contado</span>
              <span className="font-display text-xl font-bold text-white">{format(countedTotal)}</span>
            </div>
          </div>

          <Input label="Observaciones del cierre" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Notas sobre diferencias, incidencias, etc. (opcional)" />
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

      <Modal
        open={!!detailSessionId}
        onClose={() => setDetailSessionId(null)}
        title="Detalle de sesion de caja"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetailSessionId(null)}>
            Cerrar
          </Button>
        }
      >
        {!detail ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{detail.session.user?.name}</p>
                <p className="text-xs text-slate-500">
                  Apertura: {dayjs(detail.session.openedAt).format('DD/MM/YYYY HH:mm')}
                  {detail.session.closedAt && ` | Cierre: ${dayjs(detail.session.closedAt).format('DD/MM/YYYY HH:mm')}`}
                </p>
              </div>
              <Badge tone={detail.session.status === 'ABIERTA' ? 'green' : 'gray'}>{detail.session.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-500">Inicial</p>
                <p className="mt-1 font-semibold text-slate-800">{format(detail.session.openingAmount)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-500">Esperado</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {detail.session.expectedAmount != null ? format(detail.session.expectedAmount) : format(detail.expectedCash)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-500">Declarado</p>
                <p className="mt-1 font-semibold text-slate-800">{detail.session.declaredAmount != null ? format(detail.session.declaredAmount) : '-'}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${detail.session.difference == null ? 'bg-slate-50' : Number(detail.session.difference) === 0 ? 'bg-slate-50' : Number(detail.session.difference) > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                <p className="text-[11px] font-bold uppercase text-slate-500">Diferencia</p>
                <p className="mt-1 font-semibold text-slate-800">{detail.session.difference != null ? format(detail.session.difference) : '-'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Resumen por metodo de pago</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl border border-slate-100 p-3 text-sm sm:grid-cols-3">
                {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800">{format(detail.totals?.[key] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {detail.session.declaredBreakdown && detail.session.declaredBreakdown.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Conteo de efectivo declarado</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-slate-100 p-3 text-sm sm:grid-cols-3">
                  {detail.session.declaredBreakdown.map((row) => (
                    <div key={row.denomination} className="flex justify-between gap-2">
                      <span className="text-slate-500">
                        {symbol}
                        {row.denomination < 1 ? row.denomination.toFixed(2) : row.denomination} x {row.quantity}
                      </span>
                      <span className="font-medium text-slate-800">{format(row.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Movimientos</p>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-slate-500">Hora</th>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-slate-500">Tipo</th>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-slate-500">Descripcion</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-slate-500">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.session.movements?.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-1.5">{dayjs(m.createdAt).format('HH:mm')}</td>
                        <td className="px-3 py-1.5">{m.type}</td>
                        <td className="px-3 py-1.5">{m.description ?? '-'}</td>
                        <td className={`px-3 py-1.5 text-right font-medium ${Number(m.amount) < 0 ? 'text-rose-600' : ''}`}>{format(m.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detail.session.notes && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <strong>Observaciones:</strong> {detail.session.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
