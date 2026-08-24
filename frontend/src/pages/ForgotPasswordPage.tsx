import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
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
        <h1 className="text-center font-display text-lg font-bold text-slate-900">Recuperar contrasena</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Ingrese su correo y le enviaremos instrucciones para restablecer su contrasena.
        </p>
        {sent ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-100">
            <MailCheck size={18} className="mt-0.5 shrink-0" />
            <span>Si el correo existe en nuestro sistema, recibira instrucciones en breve.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input label="Correo electronico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full !py-3" loading={loading}>
              Enviar instrucciones
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-slate-400">
          ¿No te llega el correo? Pide a un administrador que reinicie tu contrasena desde el modulo de Usuarios.
        </p>
        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
