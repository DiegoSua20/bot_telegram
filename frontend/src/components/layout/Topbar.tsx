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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
      <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden" onClick={onToggleSidebar}>
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="font-medium leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
              >
                <KeyRound size={16} /> Cambiar contrasena
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
