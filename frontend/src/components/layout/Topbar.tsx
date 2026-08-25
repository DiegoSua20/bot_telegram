import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/endpoints';
import { ChangePasswordModal } from '../ChangePasswordModal';

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearSession();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onToggleSidebar}>
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="relative">
        <button
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="font-semibold leading-tight text-slate-800">{user?.name}</p>
            <p className="text-xs leading-tight text-slate-400">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10">
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
              >
                <KeyRound size={16} className="text-slate-400" /> Cambiar contrasena
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Cerrar sesion
              </button>
            </div>
          </>
        )}
      </div>
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </header>
  );
}
