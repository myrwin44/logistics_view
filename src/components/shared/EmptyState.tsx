import * as React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  heading: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        className,
      )}
    >
      <Icon
        size={40}
        className="text-[#9CA3AF] opacity-60"
        aria-hidden="true"
      />

      <h3 className="text-base font-semibold text-[#374151]">{heading}</h3>

      {description && (
        <p className="text-sm text-ink-muted max-w-xs">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
