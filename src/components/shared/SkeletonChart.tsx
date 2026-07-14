import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonChartProps {
  height?: number;
}

/**
 * Skeleton placeholder for a chart area.
 * Renders a full-width rectangular Skeleton at the specified height (default 300px).
 */
export function SkeletonChart({ height = 300 }: SkeletonChartProps) {
  return (
    <Skeleton
      className="w-full rounded-md"
      style={{ height }}
      aria-busy="true"
      aria-label="Loading chart"
    />
  );
}
