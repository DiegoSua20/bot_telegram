import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Trash2, ScanBarcode, Plus, X } from 'lucide-react';
import { cashApi, clientsApi, invoicesApi, productsApi, seriesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { openBlobInNewTab } from '../utils/download';
import { Client, PaymentMethod, Product } from '../types';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useCurrency } from '../hooks/useCurrency';

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  trackInventory: boolean;
  stock: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface PaymentRow {
  method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  amount: number;
  reference: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDITO', label: 'Credito' },
  { value: 'COMBINADO', label: 'Pago combinado' },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calcTotals(items: CartItem[], globalDiscount: number) {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const gross = item.quantity * item.unitPrice;
    const net = Math.max(0, gross - item.discount);
    tax += round2(net * (item.taxRate / 100));
    subtotal += net;
  }
  subtotal = round2(Math.max(0, subtotal - globalDiscount));
  tax = round2(tax);
  const total = round2(subtotal + tax);
  return { subtotal, tax, total };
}

export function InvoicingPage() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: 'EFECTIVO', amount: 0, reference: '' }]);
  const [creditDueDate, setCreditDueDate] = useState('');

  const { data: productResults } = useQuery({
    queryKey: ['pos-product-search', productSearch],
    queryFn: () => productsApi.search(productSearch).then((r) => r.data),
    enabled: productSearch.length > 1,
  });

  const { data: clientResults } = useQuery({
    queryKey: ['pos-client-search', clientSearch],
    queryFn: () => clientsApi.search(clientSearch).then((r) => r.data),
    enabled: clientSearch.length > 1,
  });

  const { data: series } = useQuery({ queryKey: ['series'], queryFn: () => seriesApi.list().then((r) => r.data) });
  const { data: cashSession } = useQuery({ queryKey: ['cash-current'], queryFn: () => cashApi.current().then((r) => r.data) });

  useEffect(() => {
    if (series && series.length > 0 && !seriesId) {
      const active = series.find((s) => s.active);
      if (active) setSeriesId(active.id);
    }
  }, [series, seriesId]);

  const totals = useMemo(() => calcTotals(cart, globalDiscount), [cart, globalDiscount]);
  const paymentsTotal = useMemo(() => round2(payments.reduce((a, p) => a + (Number(p.amount) || 0), 0)), [payments]);

  useEffect(() => {
    if (paymentMethod === 'CREDITO' || paymentMethod === 'COMBINADO') return;
    setPayments((prev) =>
      prev.length === 1 && prev[0].method === paymentMethod ? [{ ...prev[0], amount: totals.total }] : prev,
    );
  }, [totals.total, paymentMethod]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          trackInventory: product.trackInventory,
          stock: Number(product.stock),
          quantity: 1,
          unitPrice: Number(product.salePrice),
          discount: 0,
          taxRate: Number(product.taxRate),
        },
      ];
    });
    setProductSearch('');
  };

  const handleBarcodeSubmit = async () => {
    if (!barcodeInput.trim()) return;
    try {
      const res = await productsApi.byBarcode(barcodeInput.trim());
      addToCart(res.data);
    } catch {
      toast.error('Producto no encontrado con ese codigo de barras');
    }
    setBarcodeInput('');
  };

  const updateCartItem = (productId: string, patch: Partial<CartItem>) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const resetForm = () => {
    setCart([]);
    setGlobalDiscount(0);
    setNotes('');
    setClient(null);
    setPaymentMethod('EFECTIVO');
    setPayments([{ method: 'EFECTIVO', amount: 0, reference: '' }]);
    setCreditDueDate('');
  };

  const createMutation = useMutation({
    mutationFn: () =>
      invoicesApi.create({
        clientId: client!.id,
        seriesId: seriesId || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
        discount: globalDiscount,
        notes: notes || undefined,
        paymentMethod,
        payments: paymentMethod === 'CREDITO' ? [] : payments.filter((p) => p.amount > 0),
        creditDueDate: paymentMethod === 'CREDITO' && creditDueDate ? creditDueDate : undefined,
      }),
    onSuccess: (res) => {
      toast.success(`Factura ${res.data.fullNumber} creada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['cash-current'] });
      openBlobInNewTab(invoicesApi.pdfPath(res.data.id)).catch(() => undefined);
      resetForm();
      navigate(`/facturas/${res.data.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = () => {
    if (!client) {
      toast.error('Seleccione un cliente');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }
    if (paymentMethod !== 'CREDITO' && Math.abs(paymentsTotal - totals.total) > 0.01) {
      toast.error(`El total pagado (${format(paymentsTotal)}) debe coincidir con el total (${format(totals.total)})`);
      return;
    }
    for (const item of cart) {
      if (item.trackInventory && item.quantity > item.stock) {
        toast.error(`Existencia insuficiente para ${item.name}. Disponible: ${item.stock}`);
        return;
      }
    }
    createMutation.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Facturacion"
        subtitle={
          cashSession
            ? `Caja abierta - Monto inicial ${format(cashSession.openingAmount)}`
            : 'No tiene una caja abierta. Puede facturar, pero se recomienda abrir caja.'
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar producto por nombre o SKU"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productResults && productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => addToCart(p)}
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-gray-400">{format(p.salePrice)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-52">
                <ScanBarcode size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Codigo de barras + Enter"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Cant.</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Precio</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Desc.</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                        Agregue productos para iniciar la venta
                      </td>
                    </tr>
                  )}
                  {cart.map((item) => {
                    const net = Math.max(0, item.quantity * item.unitPrice - item.discount);
                    const lineTotal = round2(net + net * (item.taxRate / 100));
                    return (
                      <tr key={item.productId}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.sku}
                            {item.trackInventory && ` - Disp: ${item.stock}`}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0.01}
                            step="0.01"
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item.productId, { quantity: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                            value={item.unitPrice}
                            onChange={(e) => updateCartItem(item.productId, { unitPrice: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                            value={item.discount}
                            onChange={(e) => updateCartItem(item.productId, { discount: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{format(lineTotal)}</td>
                        <td className="px-3 py-2 text-right">
                          <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeFromCart(item.productId)}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <Textarea label="Observaciones" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones de la factura (opcional)" />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Cliente</h3>
            {client ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.code} - {client.taxId || 'C/F'}</p>
                </div>
                <button onClick={() => setClient(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Buscar cliente por nombre, codigo o NIT" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                {clientResults && clientResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setClient(c);
                          setClientSearch('');
                        }}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-gray-400">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {series && series.length > 1 && (
              <div className="mt-3">
                <Select
                  label="Serie"
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  options={series.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Totales</h3>
            <div className="mb-2">
              <Input
                label="Descuento global"
                type="number"
                min={0}
                step="0.01"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{format(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Impuesto</span>
                <span>{format(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{format(totals.total)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Forma de pago</h3>
            <Select
              value={paymentMethod}
              onChange={(e) => {
                const value = e.target.value as PaymentMethod;
                setPaymentMethod(value);
                if (value !== 'CREDITO' && value !== 'COMBINADO') {
                  setPayments([{ method: value as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE', amount: totals.total, reference: '' }]);
                } else if (value === 'COMBINADO') {
                  setPayments([{ method: 'EFECTIVO', amount: 0, reference: '' }]);
                }
              }}
              options={PAYMENT_METHODS}
            />

            {paymentMethod === 'CREDITO' ? (
              <div className="mt-3">
                <Input
                  label="Fecha limite de pago"
                  type="date"
                  value={creditDueDate}
                  onChange={(e) => setCreditDueDate(e.target.value)}
                  hint="Si se deja vacio, se asignan 30 dias por defecto"
                />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <Select
                      label={idx === 0 ? 'Metodo' : undefined}
                      value={p.method}
                      onChange={(e) =>
                        setPayments((prev) => prev.map((row, i) => (i === idx ? { ...row, method: e.target.value as PaymentRow['method'] } : row)))
                      }
                      options={PAYMENT_METHODS.filter((m) => m.value !== 'CREDITO' && m.value !== 'COMBINADO')}
                      className="flex-1"
                    />
                    <Input
                      label={idx === 0 ? 'Monto' : undefined}
                      type="number"
                      step="0.01"
                      className="w-28"
                      value={p.amount}
                      onChange={(e) =>
                        setPayments((prev) => prev.map((row, i) => (i === idx ? { ...row, amount: Number(e.target.value) || 0 } : row)))
                      }
                    />
                    {paymentMethod === 'COMBINADO' && payments.length > 1 && (
                      <button
                        className="mb-2 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                {paymentMethod === 'COMBINADO' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPayments((prev) => [...prev, { method: 'EFECTIVO', amount: 0, reference: '' }])}
                    >
                      <Plus size={14} /> Agregar forma de pago
                    </Button>
                    <p className={`text-xs ${Math.abs(paymentsTotal - totals.total) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                      Pagado: {format(paymentsTotal)} / {format(totals.total)}
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          <Button className="w-full" size="md" loading={createMutation.isPending} onClick={handleSubmit}>
            Generar factura
          </Button>
        </div>
      </div>
    </div>
  );
}
