import { cn } from '@/lib/cn';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

export interface KPISubItem {
  label: string;
  value: number | string;
  unit?: string;
}

export interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  /** Optional secondary rows shown below the main value */
  subItems?: KPISubItem[];
  isLoading?: boolean;
}

/**
 * Displays a single KPI metric with a label, value, and optional unit.
 * Shows a skeleton placeholder while data is loading.
 * Supports optional subItems for secondary breakdown data.
 */
export function KPICard({ label, value, unit, subItems, isLoading }: KPICardProps) {
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

      {/* Sub items — secondary breakdown rows */}
      {subItems && subItems.length > 0 && (
        <dl className="mt-2 space-y-1 border-t border-[#F3F4F6] pt-2">
          {subItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <dt className="text-xs text-[#9CA3AF] truncate">{item.label}</dt>
              <dd className="text-xs font-medium tabular-nums text-[#374151] flex-shrink-0">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                {item.unit && (
                  <span className="text-[#9CA3AF] ml-0.5">{item.unit}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
