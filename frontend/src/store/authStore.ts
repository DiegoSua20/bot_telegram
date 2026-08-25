import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  hasPermission: (...codes: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      hasPermission: (...codes) => {
        const user = get().user;
        if (!user) return false;
        return codes.some((c) => user.permissions.includes(c));
      },
    }),
    { name: 'facturacion-auth' },
  ),
);
