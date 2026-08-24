import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-brand-950 to-brand-800 px-4">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-600/30">
          F
        </div>
        <h1 className="text-center font-display text-lg font-bold text-slate-900">Restablecer contrasena</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">Ingrese su nueva contrasena.</p>
        {!token ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-100">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>El enlace no es valido. Solicite uno nuevo desde la pantalla de recuperacion.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input label="Nueva contrasena" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirmar contrasena" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" className="w-full !py-3" loading={loading}>
              Restablecer
            </Button>
          </form>
        )}
        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
