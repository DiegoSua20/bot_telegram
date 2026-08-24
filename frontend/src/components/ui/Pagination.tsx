import { Pagination as PaginationType } from '../../types';
import { Button } from './Button';

export function Pagination({ pagination, onPageChange }: { pagination: PaginationType; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-gray-600">
      <span>
        Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
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
