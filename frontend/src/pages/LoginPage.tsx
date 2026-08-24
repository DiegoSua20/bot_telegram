import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const HIGHLIGHTS = [
  { icon: Zap, text: 'Facturacion rapida con control de inventario automatico' },
  { icon: BarChart3, text: 'Reportes y utilidades en tiempo real' },
  { icon: ShieldCheck, text: 'Roles, permisos y auditoria de cada operacion' },
];

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
    <div className="flex min-h-screen bg-[#f4f5fa]">
      {/* Marketing panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-900 via-brand-950 to-brand-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold ring-1 ring-white/20">
            F
          </div>
          <span className="font-display text-lg font-bold">Facturacion Pro</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            El sistema de facturacion que tu negocio merece.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Ventas, inventario, caja, cuentas por cobrar y reportes en un solo lugar, con la seguridad y el control
            que necesitas para operar todos los dias.
          </p>
          <div className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <h.icon size={16} className="text-brand-300" />
                </div>
                <p className="text-sm text-slate-200">{h.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 size={14} className="text-emerald-400" />
          Datos protegidos con autenticacion segura y control por roles
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-600/30">
              F
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
          <p className="mt-1.5 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            <Button type="submit" className="w-full !py-3" loading={loading}>
              Ingresar
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
              Olvide mi contrasena
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
