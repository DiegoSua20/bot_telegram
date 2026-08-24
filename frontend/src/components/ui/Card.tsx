import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-xl border border-gray-200 bg-white p-4 shadow-sm', className)}>{children}</div>;
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
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg', toneClasses[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}
