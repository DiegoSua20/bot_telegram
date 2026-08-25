import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Category } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';

const emptyForm = { name: '', description: '' };

export function CategoriesPage() {
  const canManage = useAuthStore((s) => s.hasPermission(PERMISSIONS.CATEGORIES_MANAGE));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create(form),
    onSuccess: () => {
      toast.success('Categoria creada');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => categoriesApi.update(editing!.id, form),
    onSuccess: () => {
      toast.success('Categoria actualizada');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (c: Category) => categoriesApi.setActive(c.id, !c.active),
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
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? '' });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Nombre', render: (c) => c.name },
    { key: 'description', header: 'Descripcion', render: (c) => c.description || '-' },
    { key: 'products', header: 'Productos', render: (c) => c._count?.products ?? 0 },
    {
      key: 'active',
      header: 'Estado',
      render: (c) => <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEdit(c)}>
              <Pencil size={15} />
            </button>
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => toggleMutation.mutate(c)}>
              <Power size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categorias"
        subtitle="Clasificacion de productos y servicios"
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Nueva categoria
            </Button>
          )
        }
      />
      <Table columns={columns} data={data ?? []} rowKey={(c) => c.id} loading={isLoading} />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar categoria' : 'Nueva categoria'}
        size="sm"
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
        <div className="space-y-3">
          <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Descripcion" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
