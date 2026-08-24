import { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const toneClasses: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const dotClasses: Record<Tone, string> = {
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  yellow: 'bg-amber-500',
  blue: 'bg-brand-500',
  purple: 'bg-violet-500',
};

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />
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
