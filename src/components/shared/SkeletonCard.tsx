import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton placeholder for a KPI card.
 * Renders a label line (h-3, w-[60px]) and a value line (h-6, w-[80px])
 * with a small vertical gap — matching the KPICard layout.
 */
export function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-2 p-4"
      aria-busy="true"
      aria-label="Loading"
    >
      {/* Label line: 12px tall, 60px wide */}
      <Skeleton className="h-3 w-[60px]" />
      {/* Value line: 24px tall, 80px wide */}
      <Skeleton className="h-6 w-[80px]" />
    </div>
  );
}
