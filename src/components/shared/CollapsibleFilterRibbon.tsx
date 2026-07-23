/**
 * CollapsibleFilterRibbon — A collapsible ribbon component for filter/search sections.
 * Provides a toggle button to expand/collapse filter content to optimize screen space.
 */

import * as React from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CollapsibleFilterRibbonProps {
  /** The filter content to display when expanded */
  children: React.ReactNode;
  /** Optional label for the ribbon header */
  label?: string;
  /** Whether the ribbon starts expanded (default: true) */
  defaultExpanded?: boolean;
  /** Optional className for the container */
  className?: string;
}

export function CollapsibleFilterRibbon({
  children,
  label = 'Bộ lọc',
  defaultExpanded = true,
  className,
}: CollapsibleFilterRibbonProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn('border border-border rounded-lg bg-white', className)}>
      {/* Header with toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-500" />
        ) : (
          <ChevronDown size={16} className="text-slate-500" />
        )}
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
