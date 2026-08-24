import { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const toneClasses: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone])}>
      {children}
    </span>
  );
}

const INVOICE_STATUS_TONE: Record<string, Tone> = {
  EMITIDA: 'blue',
  PAGADA: 'green',
  PENDIENTE: 'yellow',
  PARCIAL: 'purple',
  ANULADA: 'red',
  ABIERTA: 'green',
  CERRADA: 'gray',
  PAGADO: 'green',
  VENCIDO: 'red',
  ACTIVO: 'green',
  INACTIVO: 'gray',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={INVOICE_STATUS_TONE[status] ?? 'gray'}>{status}</Badge>;
}
