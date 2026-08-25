import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Power, KeyRound } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { rolesApi, usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Role, User } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../constants/permissions';
import clsx from 'clsx';

const emptyUserForm = { name: '', username: '', email: '', password: '', roleId: '' };

export function UsersPage() {
  const canManageUsers = useAuthStore((s) => s.hasPermission(PERMISSIONS.USERS_MANAGE));
  const canManageRoles = useAuthStore((s) => s.hasPermission(PERMISSIONS.ROLES_MANAGE));
  const [tab, setTab] = useState<'users' | 'roles'>('users');

  return (
    <div>
      <PageHeader title="Usuarios y roles" subtitle="Gestion de usuarios, roles y permisos" />
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        <button
          className={clsx('px-4 py-2 text-sm font-medium', tab === 'users' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500')}
          onClick={() => setTab('users')}
        >
          Usuarios
        </button>
        {canManageRoles && (
          <button
            className={clsx('px-4 py-2 text-sm font-medium', tab === 'roles' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500')}
            onClick={() => setTab('roles')}
          >
            Roles y permisos
          </button>
        )}
      </div>
      {tab === 'users' ? <UsersTab canManage={canManageUsers} /> : <RolesTab />}
    </div>
  );
}

function UsersTab({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyUserForm);
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list().then((r) => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list({ page: String(page), pageSize: '10' }).then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      toast.success('Usuario creado');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(editing!.id, { name: form.name, username: form.username, email: form.email, roleId: form.roleId }),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (u: User) => usersApi.setActive(u.id, !u.active),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: () => usersApi.resetPassword(resetModalUser!.id, resetPassword),
    onSuccess: () => {
      toast.success('Contrasena reiniciada');
      setResetModalUser(null);
      setResetPassword('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUserForm);
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, username: u.username, email: u.email, password: '', roleId: u.roleId });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Nombre', render: (u) => u.name },
    { key: 'username', header: 'Usuario', render: (u) => u.username },
    { key: 'email', header: 'Correo', render: (u) => u.email },
    { key: 'role', header: 'Rol', render: (u) => u.role.name },
    { key: 'lastLogin', header: 'Ultimo acceso', render: (u) => (u.lastLoginAt ? dayjs(u.lastLoginAt).format('DD/MM/YYYY HH:mm') : 'Nunca') },
    { key: 'active', header: 'Estado', render: (u) => <Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEdit(u)} title="Editar">
              <Pencil size={15} />
            </button>
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setResetModalUser(u)} title="Reiniciar contrasena">
              <KeyRound size={15} />
            </button>
            <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => toggleMutation.mutate(u)} title={u.active ? 'Desactivar' : 'Activar'}>
              <Power size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      {canManage && (
        <div className="mb-4">
          <Button onClick={openCreate}>
            <Plus size={16} /> Nuevo usuario
          </Button>
        </div>
      )}
      <Table columns={columns} data={data?.items ?? []} rowKey={(u) => u.id} loading={isLoading} />
      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button loading={createMutation.isPending || updateMutation.isPending} onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Usuario" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input label="Correo" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select
            label="Rol"
            required
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            options={(roles ?? []).map((r) => ({ value: r.id, label: r.name }))}
          />
          {!editing && (
            <div className="col-span-2">
              <Input label="Contrasena" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Reiniciar contrasena - ${resetModalUser?.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModalUser(null)}>
              Cancelar
            </Button>
            <Button loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
              Reiniciar
            </Button>
          </>
        }
      >
        <Input label="Nueva contrasena" type="password" required value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
      </Modal>
    </div>
  );
}

function RolesTab() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list().then((r) => r.data) });
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: () => rolesApi.permissions().then((r) => r.data) });

  const updateMutation = useMutation({
    mutationFn: () => rolesApi.updatePermissions(selectedRole!.id, selectedPermissionIds),
    onSuccess: () => {
      toast.success('Permisos actualizados');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(role.permissions.map((p) => p.permission.id));
  };

  const grouped = (permissions ?? []).reduce<Record<string, typeof permissions>>((acc, p) => {
    acc[p.module] = acc[p.module] ? [...acc[p.module]!, p] : [p];
    return acc;
  }, {});

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="space-y-1">
          {(roles ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => selectRole(r)}
              className={clsx(
                'w-full rounded-lg px-3 py-2 text-left text-sm',
                selectedRole?.id === r.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        {!selectedRole ? (
          <p className="text-sm text-gray-400">Seleccione un rol para ver y editar sus permisos.</p>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Permisos de {selectedRole.name}</h3>
              <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                Guardar cambios
              </Button>
            </div>
            <div className="space-y-4">
              {Object.entries(grouped).map(([module, perms]) => (
                <div key={module} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{module}</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {perms?.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={selectedPermissionIds.includes(p.id)} onChange={() => togglePermission(p.id)} />
                        {p.description}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
