import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { companyApi, seriesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useCompanyStore } from '../store/companyStore';

export function CompanyConfigPage() {
  const queryClient = useQueryClient();
  const setGlobalConfig = useCompanyStore((s) => s.setConfig);
  const { data: config } = useQuery({ queryKey: ['company-config'], queryFn: () => companyApi.get().then((r) => r.data) });
  const { data: series } = useQuery({ queryKey: ['series'], queryFn: () => seriesApi.list().then((r) => r.data) });

  const [form, setForm] = useState({
    tradeName: '',
    legalName: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    currency: 'GTQ',
    currencySymbol: 'Q',
    defaultTaxRate: '12',
    country: 'Guatemala',
    invoiceFormat: 'A4',
    allowOversell: false,
    requireOpenCashRegister: false,
  });
  const [newSeriesName, setNewSeriesName] = useState('');

  useEffect(() => {
    if (config) {
      setForm({
        tradeName: config.tradeName,
        legalName: config.legalName,
        taxId: config.taxId,
        address: config.address ?? '',
        phone: config.phone ?? '',
        email: config.email ?? '',
        currency: config.currency,
        currencySymbol: config.currencySymbol,
        defaultTaxRate: String(config.defaultTaxRate),
        country: config.country,
        invoiceFormat: config.invoiceFormat,
        allowOversell: config.allowOversell,
        requireOpenCashRegister: config.requireOpenCashRegister,
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: () => companyApi.update({ ...form, defaultTaxRate: Number(form.defaultTaxRate) }),
    onSuccess: (res) => {
      toast.success('Configuracion actualizada');
      setGlobalConfig(res.data);
      queryClient.invalidateQueries({ queryKey: ['company-config'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: (res) => {
      toast.success('Logo actualizado');
      setGlobalConfig(res.data);
      queryClient.invalidateQueries({ queryKey: ['company-config'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createSeriesMutation = useMutation({
    mutationFn: () => seriesApi.create(newSeriesName),
    onSuccess: () => {
      toast.success('Serie creada');
      setNewSeriesName('');
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleSeriesMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => seriesApi.setActive(id, active),
    onSuccess: () => {
      toast.success('Serie actualizada');
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="Configuracion de empresa" subtitle="Datos generales, moneda, formato de factura y series" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Datos generales</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre comercial" required value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
            <Input label="Razon social" required value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
            <Input label="NIT / Identificacion tributaria" required value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <Input label="Pais" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="col-span-2">
              <Input label="Direccion" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Input label="Moneda (codigo)" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} hint="Ej. GTQ, USD" />
            <Input label="Simbolo de moneda" value={form.currencySymbol} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} hint="Ej. Q, $" />
            <Input label="Impuesto predeterminado (%)" type="number" step="0.01" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })} />
            <Select
              label="Formato de factura"
              value={form.invoiceFormat}
              onChange={(e) => setForm({ ...form, invoiceFormat: e.target.value })}
              options={[
                { value: 'A4', label: 'A4' },
                { value: 'CARTA', label: 'Carta' },
                { value: 'THERMAL', label: 'Ticket termico' },
              ]}
            />
            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.allowOversell} onChange={(e) => setForm({ ...form, allowOversell: e.target.checked })} />
              Permitir vender mas cantidad de la disponible en inventario
            </label>
            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.requireOpenCashRegister}
                onChange={(e) => setForm({ ...form, requireOpenCashRegister: e.target.checked })}
              />
              Exigir caja abierta para poder facturar (no aplica a ventas al credito)
            </label>
          </div>
          <div className="mt-4">
            <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              Guardar cambios
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Logo</h3>
            {config?.logoUrl && <img src={config.logoUrl} alt="Logo" className="mb-3 h-20 w-20 rounded object-contain" />}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 hover:bg-gray-50">
              <Upload size={16} /> Subir logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) logoMutation.mutate(file);
                }}
              />
            </label>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Series y correlativos</h3>
            <div className="space-y-2">
              {(series ?? []).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">Serie {s.name}</p>
                    <p className="text-xs text-gray-500">Siguiente numero: {s.currentNumber + 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={s.active ? 'green' : 'gray'}>{s.active ? 'Activa' : 'Inactiva'}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => toggleSeriesMutation.mutate({ id: s.id, active: !s.active })}>
                      {s.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Nueva serie (ej. B)" value={newSeriesName} onChange={(e) => setNewSeriesName(e.target.value)} />
              <Button
                variant="secondary"
                disabled={!newSeriesName.trim()}
                loading={createSeriesMutation.isPending}
                onClick={() => createSeriesMutation.mutate()}
              >
                Agregar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
