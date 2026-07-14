import * as React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-primary text-white border-transparent',
  secondary:
    'bg-surface text-ink border-transparent',
  outline:
    'bg-transparent text-ink border-border',
  destructive:
    'bg-red-100 text-red-700 border-transparent',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
