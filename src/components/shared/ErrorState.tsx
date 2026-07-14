import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  variant?: 'full' | 'banner' | 'inline';
  className?: string;
}

export function ErrorState({ message, onRetry, variant = 'full', className }: ErrorStateProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-700',
          className,
        )}
        role="alert"
      >
        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto text-xs underline shrink-0"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700',
          className,
        )}
        role="alert"
      >
        <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto text-xs underline shrink-0"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  // variant === 'full' (default)
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        className,
      )}
      role="alert"
    >
      <AlertCircle
        size={40}
        className="text-red-500"
        aria-hidden="true"
      />

      <p className="text-sm text-ink max-w-xs">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
            'border border-border bg-transparent text-ink hover:bg-surface',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}
