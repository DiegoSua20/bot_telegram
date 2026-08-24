import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
      <p className="text-3xl font-bold text-gray-300">404</p>
      <p className="text-sm text-gray-500">La pagina que busca no existe.</p>
      <Link to="/dashboard" className="mt-2 text-sm text-brand-600 hover:underline">
        Volver al dashboard
      </Link>
    </div>
  );
}
