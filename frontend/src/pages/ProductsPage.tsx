import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi, productsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Product } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';
import { useCurrency } from '../hooks/useCurrency';

const emptyForm = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  type: 'PRODUCTO' as 'PRODUCTO' | 'SERVICIO',
  salePrice: '0',
  costPrice: '0',
  taxRate: '12',
  trackInventory: true,
  stock: '0',
  minStock: '0',
  unit: 'UNIDAD',
};

export function ProductsPage() {
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.PRODUCTS_MANAGE));
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ['categories', 'active'], queryFn: () => categoriesApi.list(true).then((r) => r.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, categoryId, type, lowStock, page],
    queryFn: () =>
      productsApi
        .list({
          search,
          categoryId,
          type,
          lowStock: lowStock ? 'true' : '',
          page: String(page),
          pageSize: '10',
        })
        .then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const buildPayload = () => ({
    ...form,
    categoryId: form.categoryId || null,
    salePrice: Number(form.salePrice),
    costPrice: Number(form.costPrice),
    taxRate: Number(form.taxRate),
    stock: Number(form.stock),
    minStock: Number(form.minStock),
    trackInventory: form.type === 'SERVICIO' ? false : form.trackInventory,
  });

  const createMutation = useMutation({
    mutationFn: () => productsApi.create(buildPayload()),
    onSuccess: () => {
      toast.success('Producto creado');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => productsApi.update(editing!.id, buildPayload()),
    onSuccess: () => {
      toast.success('Producto actualizado');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (p: Product) => productsApi.setActive(p.id, !p.active),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      barcode: p.barcode ?? '',
      name: p.name,
      description: p.description ?? '',
      categoryId: p.categoryId ?? '',
      type: p.type,
      salePrice: String(p.salePrice),
      costPrice: String(p.costPrice),
      taxRate: String(p.taxRate),
      trackInventory: p.trackInventory,
      stock: String(p.stock),
      minStock: String(p.minStock),
      unit: p.unit,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const columns: Column<Product>[] = [
    { key: 'sku', header: 'SKU', render: (p) => p.sku },
    { key: 'name', header: 'Nombre', render: (p) => p.name },
    { key: 'category', header: 'Categoria', render: (p) => p.category?.name ?? '-' },
    { key: 'type', header: 'Tipo', render: (p) => <Badge tone={p.type === 'SERVICIO' ? 'purple' : 'blue'}>{p.type}</Badge> },
    { key: 'price', header: 'Precio', render: (p) => format(p.salePrice) },
    {
      key: 'stock',
      header: 'Existencia',
      render: (p) =>
        p.trackInventory ? (
          <span className={Number(p.stock) <= Number(p.minStock) ? 'font-semibold text-red-600' : ''}>
            {Number(p.stock)} {p.unit}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'active',
      header: 'Estado',
      render: (p) => <Badge tone={p.active ? 'green' : 'gray'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEdit(p)}>
              <Pencil size={15} />
            </button>
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => toggleMutation.mutate(p)}>
              <Power size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Productos y servicios"
        subtitle="Catalogo de productos y servicios"
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Nuevo producto
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, SKU o codigo de barras"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          className="max-w-[180px]"
          placeholder="Todas las categorias"
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          className="max-w-[160px]"
          placeholder="Todos los tipos"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          options={[
            { value: 'PRODUCTO', label: 'Producto' },
            { value: 'SERVICIO', label: 'Servicio' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setPage(1);
              setLowStock(e.target.checked);
            }}
          />
          Solo bajo inventario
        </label>
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(p) => p.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="SKU / Codigo" placeholder="Autogenerado si se deja vacio" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label="Codigo de barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <div className="col-span-2">
            <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Input label="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Select
            label="Categoria"
            placeholder="Sin categoria"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Tipo"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'PRODUCTO' | 'SERVICIO' })}
            options={[
              { value: 'PRODUCTO', label: 'Producto' },
              { value: 'SERVICIO', label: 'Servicio' },
            ]}
          />
          <Input label="Precio de venta" type="number" step="0.01" required value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
          <Input label="Precio de costo" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <Input label="Impuesto (%)" type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          <Input label="Unidad de medida" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          {form.type === 'PRODUCTO' && (
            <>
              <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.trackInventory}
                  onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
                />
                Controlar inventario para este producto
              </label>
              {form.trackInventory && (
                <>
                  <Input label="Existencia inicial" type="number" value={form.stock} disabled={!!editing} onChange={(e) => setForm({ ...form, stock: e.target.value })} hint={editing ? 'Use el modulo de Inventario para ajustar existencias' : undefined} />
                  <Input label="Existencia minima" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                </>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
