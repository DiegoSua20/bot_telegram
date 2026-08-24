import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      setSession(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            F
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Sistema de Facturacion</h1>
          <p className="text-sm text-gray-500">Ingrese sus credenciales para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuario o correo"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Contrasena"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
            Olvide mi contrasena
          </Link>
        </div>
      </div>
    </div>
  );
}
