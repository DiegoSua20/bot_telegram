import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Search, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Client } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';

const emptyForm = {
  code: '',
  name: '',
  taxId: '',
  address: '',
  phone: '',
  email: '',
  contact: '',
  notes: '',
};

export function ClientsPage() {
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.CLIENTS_MANAGE));
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, activeFilter, page],
    queryFn: () =>
      clientsApi
        .list({ search, active: activeFilter, page: String(page), pageSize: '10' })
        .then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] });

  const createMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) => clientsApi.create(payload),
    onSuccess: () => {
      toast.success('Cliente creado correctamente');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) => clientsApi.update(editing!.id, payload),
    onSuccess: () => {
      toast.success('Cliente actualizado');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (c: Client) => clientsApi.setActive(c.id, !c.active),
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

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      taxId: c.taxId ?? '',
      address: c.address ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      contact: c.contact ?? '',
      notes: c.notes ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (editing) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  const columns: Column<Client>[] = [
    { key: 'code', header: 'Codigo', render: (c) => c.code },
    { key: 'name', header: 'Nombre', render: (c) => c.name },
    { key: 'taxId', header: 'NIT/ID', render: (c) => c.taxId || '-' },
    { key: 'phone', header: 'Telefono', render: (c) => c.phone || '-' },
    { key: 'email', header: 'Correo', render: (c) => c.email || '-' },
    {
      key: 'active',
      header: 'Estado',
      render: (c) => <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEdit(c)} title="Editar">
              <Pencil size={15} />
            </button>
            <button
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
              onClick={() => toggleMutation.mutate(c)}
              title={c.active ? 'Desactivar' : 'Activar'}
            >
              <Power size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Administracion de clientes"
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Nuevo cliente
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, codigo o NIT"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          className="max-w-[160px]"
          value={activeFilter}
          onChange={(e) => {
            setPage(1);
            setActiveFilter(e.target.value);
          }}
          placeholder="Todos los estados"
          options={[
            { value: 'true', label: 'Activos' },
            { value: 'false', label: 'Inactivos' },
          ]}
        />
      </div>

      <Table columns={columns} data={data?.items ?? []} rowKey={(c) => c.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button loading={createMutation.isPending || updateMutation.isPending} onClick={handleSubmit}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Codigo"
            placeholder="Autogenerado si se deja vacio"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="NIT / Identificacion" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          <Input label="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <div className="col-span-2">
            <Input label="Direccion" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Textarea label="Observaciones" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
