import { Pagination as PaginationType } from '../../types';
import { Button } from './Button';

export function Pagination({ pagination, onPageChange }: { pagination: PaginationType; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 py-4 text-sm text-slate-500">
      <span>
        Pagina <span className="font-semibold text-slate-700">{pagination.page}</span> de{' '}
        <span className="font-semibold text-slate-700">{pagination.totalPages}</span> ({pagination.total} registros)
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
