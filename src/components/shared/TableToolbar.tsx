import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TableToolbarProps {
  title: string;
  isLoading?: boolean;
  /** E.g. "trang 2/5" — shown when not loading. */
  pageInfo?: string;
  /** E.g. "01/01 → 31/01/2026" — date range indicator. */
  dateRange?: string;
  /** E.g. "lọc: 3" — shown when client-side filtering is active. */
  filterInfo?: string;
  /** Slot for additional right-side content (e.g. buttons). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * TableToolbar — a compact toolbar rendered above table content.
 *
 * Left side: title + optional loading spinner + optional pageInfo badge + optional filterInfo.
 * Right side: optional dateRange indicator + optional actions slot.
 */
export function TableToolbar({
  title,
  isLoading,
  pageInfo,
  dateRange,
  filterInfo,
  actions,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50',
        className,
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">{title}</span>

        {/* Loading spinner */}
        {isLoading && (
          <Loader2 size={11} className="animate-spin text-primary" />
        )}

        {/* PageInfo badge — only shown when not loading and value is provided */}
        {!isLoading && pageInfo && (
          <span className="text-[10px] bg-blue-50 text-brand-mid font-semibold px-2 py-0.5 rounded-full">
            {pageInfo}
          </span>
        )}

        {/* FilterInfo */}
        {filterInfo && (
          <span className="text-[10px] text-ink-muted">{filterInfo}</span>
        )}
      </div>

      {/* Right side */}
      {(dateRange || actions) && (
        <div className="flex items-center gap-2">
          {dateRange && (
            <span className="text-[10px] text-ink-muted">{dateRange}</span>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
