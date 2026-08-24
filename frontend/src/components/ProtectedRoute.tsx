import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children, permissions }: { children: ReactNode; permissions?: string[] }) {
  const token = useAuthStore((s) => s.token);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (permissions && permissions.length > 0 && !hasPermission(...permissions)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-lg font-semibold text-gray-800">Acceso denegado</p>
        <p className="text-sm text-gray-500">No tiene permisos para ver este modulo.</p>
      </div>
    );
  }

  return <>{children}</>;
}
