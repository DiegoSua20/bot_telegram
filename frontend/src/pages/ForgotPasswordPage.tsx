import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Recuperar contrasena</h1>
        <p className="mb-6 text-sm text-gray-500">
          Ingrese su correo y le enviaremos instrucciones para restablecer su contrasena.
        </p>
        {sent ? (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Si el correo existe en nuestro sistema, recibira instrucciones en breve.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Correo electronico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full" loading={loading}>
              Enviar instrucciones
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
