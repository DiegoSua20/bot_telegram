import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]', className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'green' | 'red' | 'amber' | 'purple';
}) {
  const toneClasses: Record<string, string> = {
    brand: 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-600/25',
    green: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-600/25',
    red: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-600/25',
    amber: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-600/25',
    purple: 'bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-600/25',
  };
  return (
    <Card className="group flex items-center gap-4 transition-transform duration-150 hover:-translate-y-0.5">
      {icon && (
        <div
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg',
            toneClasses[tone],
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 truncate font-display text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}
