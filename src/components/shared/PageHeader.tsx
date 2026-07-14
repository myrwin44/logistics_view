import * as React from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional Lucide icon rendered to the left of the title. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
  /** Optional slot for action buttons rendered on the right side. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — shared page-level heading component.
 *
 * - Small variant (icon present): flex row, text-sm heading matching AllTrips style.
 * - Large variant (no icon): block header, text-xl heading matching BillOfLading style.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  if (Icon) {
    // Small variant — icon present
    return (
      <header className={cn('flex items-center gap-2', className)}>
        <Icon size={16} className="text-primary shrink-0" />
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-ink-muted mt-0.5">{description}</p>
        )}
        {actions && <div className="ml-auto">{actions}</div>}
      </header>
    );
  }

  // Large variant — no icon
  return (
    <header className={cn(className)}>
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      {description && (
        <p className="text-sm text-ink-muted mt-0.5">{description}</p>
      )}
    </header>
  );
}
