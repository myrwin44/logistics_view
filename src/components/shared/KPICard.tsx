import { cn } from '@/lib/cn';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

export interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  isLoading?: boolean;
}

/**
 * Displays a single KPI metric with a label, value, and optional unit.
 * Shows a skeleton placeholder while data is loading.
 */
export function KPICard({ label, value, unit, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-border bg-white p-4',
      )}
    >
      {/* Label — small, muted */}
      <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </span>

      {/* Value row — headline size, tabular-nums */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-2xl font-semibold leading-none text-gray-900',
            'tabular-nums',
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {/* Optional unit — body size, muted */}
        {unit && (
          <span className="text-sm text-ink-muted">{unit}</span>
        )}
      </div>
    </div>
  );
}
