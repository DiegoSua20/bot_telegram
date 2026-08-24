import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventoryApi, productsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { InventoryMovement, MovementType, Product } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';
import dayjs from 'dayjs';

const TYPE_TONE: Record<MovementType, 'green' | 'red' | 'yellow'> = {
  ENTRADA: 'green',
  SALIDA: 'red',
  AJUSTE: 'yellow',
};

export function InventoryPage() {
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.INVENTORY_MANAGE));
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ type: 'ENTRADA' as MovementType, quantity: '', reason: '', reference: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', type, dateFrom, dateTo, page],
    queryFn: () =>
      inventoryApi.listMovements({ type, dateFrom, dateTo, page: String(page), pageSize: '15' }).then((r) => r.data),
  });

  const { data: productResults } = useQuery({
    queryKey: ['product-search', productSearch],
    queryFn: () => productsApi.search(productSearch).then((r) => r.data),
    enabled: productSearch.length > 1,
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      inventoryApi.register({
        productId: selectedProduct!.id,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason,
        reference: form.reference || undefined,
      }),
    onSuccess: () => {
      toast.success('Movimiento registrado');
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    setProductSearch('');
    setForm({ type: 'ENTRADA', quantity: '', reason: '', reference: '' });
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      toast.error('Seleccione un producto');
      return;
    }
    if (!form.quantity || !form.reason.trim()) {
      toast.error('Complete cantidad y motivo');
      return;
    }
    registerMutation.mutate();
  };

  const columns: Column<InventoryMovement>[] = [
    { key: 'date', header: 'Fecha', render: (m) => dayjs(m.createdAt).format('DD/MM/YYYY HH:mm') },
    {
      key: 'product',
      header: 'Producto',
      render: (m) => (
        <Link to={`/inventario/kardex/${m.productId}`} className="text-brand-600 hover:underline">
          {m.product?.name}
        </Link>
      ),
    },
    { key: 'type', header: 'Tipo', render: (m) => <Badge tone={TYPE_TONE[m.type]}>{m.type}</Badge> },
    { key: 'quantity', header: 'Cantidad', render: (m) => Number(m.quantity) },
    { key: 'balance', header: 'Saldo', render: (m) => Number(m.balanceAfter) },
    { key: 'reason', header: 'Motivo', render: (m) => m.reason },
    { key: 'user', header: 'Usuario', render: (m) => m.user?.name ?? '-' },
  ];

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Entradas, salidas y ajustes de existencias"
        actions={
          canManage && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Registrar movimiento
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          className="max-w-[160px]"
          placeholder="Todos los tipos"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          options={[
            { value: 'ENTRADA', label: 'Entrada' },
            { value: 'SALIDA', label: 'Salida' },
            { value: 'AJUSTE', label: 'Ajuste' },
          ]}
        />
        <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} className="max-w-[160px]" />
        <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} className="max-w-[160px]" />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(m) => m.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Registrar movimiento de inventario"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button loading={registerMutation.isPending} onClick={handleSubmit}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {selectedProduct ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">
                  SKU: {selectedProduct.sku} | Existencia actual: {Number(selectedProduct.stock)}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(null)}>
                Cambiar
              </Button>
            </div>
          ) : (
            <div>
              <Input
                label="Buscar producto"
                placeholder="Nombre, SKU o codigo de barras"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productResults && productResults.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  {productResults
                    .filter((p) => p.trackInventory)
                    .map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductSearch('');
                        }}
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-gray-400">{p.sku}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          <Select
            label="Tipo de movimiento"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}
            options={[
              { value: 'ENTRADA', label: 'Entrada' },
              { value: 'SALIDA', label: 'Salida' },
              { value: 'AJUSTE', label: 'Ajuste (saldo nuevo)' },
            ]}
          />
          <Input
            label={form.type === 'AJUSTE' ? 'Nuevo saldo' : 'Cantidad'}
            type="number"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <Input label="Motivo" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Input label="Referencia" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
