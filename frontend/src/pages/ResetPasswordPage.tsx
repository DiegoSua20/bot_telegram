import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Contrasena actualizada. Ya puede iniciar sesion.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Restablecer contrasena</h1>
        <p className="mb-6 text-sm text-gray-500">Ingrese su nueva contrasena.</p>
        {!token ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            El enlace no es valido. Solicite uno nuevo desde la pantalla de recuperacion.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nueva contrasena" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirmar contrasena" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" className="w-full" loading={loading}>
              Restablecer
            </Button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-brand-600 hover:underline">
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
