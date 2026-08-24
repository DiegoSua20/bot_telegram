import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-react';
import { inventoryApi } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { InventoryMovement, MovementType, Product } from '../types';

const TYPE_TONE: Record<MovementType, 'green' | 'red' | 'yellow'> = {
  ENTRADA: 'green',
  SALIDA: 'red',
  AJUSTE: 'yellow',
};

export function KardexPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['kardex', productId],
    queryFn: () => inventoryApi.kardex(productId!).then((r) => r.data as { product: Product; movements: InventoryMovement[] }),
    enabled: !!productId,
  });

  const columns: Column<InventoryMovement>[] = [
    { key: 'date', header: 'Fecha', render: (m) => dayjs(m.createdAt).format('DD/MM/YYYY HH:mm') },
    { key: 'type', header: 'Tipo', render: (m) => <Badge tone={TYPE_TONE[m.type]}>{m.type}</Badge> },
    { key: 'quantity', header: 'Cantidad', render: (m) => Number(m.quantity) },
    { key: 'balance', header: 'Saldo', render: (m) => Number(m.balanceAfter) },
    { key: 'reason', header: 'Motivo', render: (m) => m.reason },
    { key: 'reference', header: 'Referencia', render: (m) => m.reference ?? '-' },
    { key: 'user', header: 'Usuario', render: (m) => m.user?.name ?? '-' },
  ];

  return (
    <div>
      <Link to="/inventario" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} /> Volver a inventario
      </Link>
      <PageHeader title="Kardex" subtitle={data ? `${data.product.name} (${data.product.sku})` : 'Cargando...'} />

      {data && (
        <Card className="mb-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-500">Existencia actual</p>
            <p className="text-lg font-semibold">{Number(data.product.stock)} {data.product.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Existencia minima</p>
            <p className="text-lg font-semibold">{Number(data.product.minStock)} {data.product.unit}</p>
          </div>
        </Card>
      )}

      <Table columns={columns} data={data?.movements ?? []} rowKey={(m) => m.id} loading={isLoading} />
    </div>
  );
}
