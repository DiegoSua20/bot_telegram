import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, Download, Ban } from 'lucide-react';
import { invoicesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { openBlobInNewTab } from '../utils/download';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const canVoid = useAuthStore((s) => s.hasPermission(PERMISSIONS.INVOICES_VOID));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<'A4' | 'THERMAL' | null>(null);

  const handleViewPdf = async (invoiceFormat: 'A4' | 'THERMAL') => {
    setPdfLoading(invoiceFormat);
    try {
      await openBlobInNewTab(invoicesApi.pdfPath(id!, invoiceFormat));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPdfLoading(null);
    }
  };

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => invoicesApi.cancel(id!, reason),
    onSuccess: () => {
      toast.success('Factura anulada correctamente');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setConfirmOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading || !invoice) {
    return <p className="text-sm text-gray-500">Cargando factura...</p>;
  }

  return (
    <div>
      <Link to="/facturas" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} /> Volver a facturas
      </Link>

      <PageHeader
        title={`Factura ${invoice.fullNumber}`}
        subtitle={dayjs(invoice.createdAt).format('DD/MM/YYYY HH:mm')}
        actions={
          <>
            <Button variant="secondary" loading={pdfLoading === 'A4'} onClick={() => handleViewPdf('A4')}>
              <Printer size={16} /> Imprimir A4
            </Button>
            <Button variant="secondary" loading={pdfLoading === 'THERMAL'} onClick={() => handleViewPdf('THERMAL')}>
              <Download size={16} /> Ticket termico
            </Button>
            {canVoid && invoice.status !== 'ANULADA' && (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                <Ban size={16} /> Anular factura
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Detalle</h3>
            <StatusBadge status={invoice.status} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-1.5 text-left">Producto</th>
                <th className="py-1.5 text-right">Cant.</th>
                <th className="py-1.5 text-right">Precio</th>
                <th className="py-1.5 text-right">Desc.</th>
                <th className="py-1.5 text-right">Impuesto</th>
                <th className="py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.details?.map((d) => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="py-1.5">{d.product.name}</td>
                  <td className="py-1.5 text-right">{Number(d.quantity)}</td>
                  <td className="py-1.5 text-right">{format(d.unitPrice)}</td>
                  <td className="py-1.5 text-right">{format(d.discount)}</td>
                  <td className="py-1.5 text-right">{format(d.taxAmount)}</td>
                  <td className="py-1.5 text-right font-medium">{format(d.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{format(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Descuento</span>
              <span>{format(invoice.discount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Impuesto</span>
              <span>{format(invoice.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{format(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <strong>Observaciones:</strong> {invoice.notes}
            </div>
          )}

          {invoice.status === 'ANULADA' && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p>
                <strong>Anulada por:</strong> {invoice.cancelledBy?.name} el {dayjs(invoice.cancelledAt).format('DD/MM/YYYY HH:mm')}
              </p>
              <p>
                <strong>Motivo:</strong> {invoice.cancelReason}
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Cliente</h3>
            <p className="text-sm font-medium">{invoice.client.name}</p>
            <p className="text-xs text-gray-500">{invoice.client.code} - {invoice.client.taxId || 'C/F'}</p>
            <p className="text-xs text-gray-500">{invoice.client.phone}</p>
            <p className="text-xs text-gray-500">{invoice.client.email}</p>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Pago</h3>
            <p className="mb-2 text-sm text-gray-600">Metodo: {invoice.paymentMethod}</p>
            {invoice.payments?.map((p) => (
              <div key={p.id} className="flex justify-between text-sm text-gray-600">
                <span>{p.method}</span>
                <span>{format(p.amount)}</span>
              </div>
            ))}
            {invoice.creditAccount && (
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Saldo pendiente</span>
                  <span className="font-medium">{format(invoice.creditAccount.balance)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vence</span>
                  <span>{dayjs(invoice.creditAccount.dueDate).format('DD/MM/YYYY')}</span>
                </div>
                <Link to={`/cuentas-por-cobrar/${invoice.creditAccount.id}`} className="text-xs text-brand-600 hover:underline">
                  Ver cuenta por cobrar
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Otros datos</h3>
            <p className="text-sm text-gray-600">Usuario: {invoice.user.name}</p>
            <p className="text-sm text-gray-600">Serie: {invoice.fullNumber.split('-')[0]}</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        options={{
          title: 'Anular factura',
          message: `Esta accion anulara la factura ${invoice.fullNumber} y reintegrara las existencias vendidas. Esta accion no se puede deshacer.`,
          requireReason: true,
          reasonLabel: 'Motivo de anulacion',
          danger: true,
          confirmLabel: 'Anular factura',
        }}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={(reason) => cancelMutation.mutate(reason ?? '')}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
