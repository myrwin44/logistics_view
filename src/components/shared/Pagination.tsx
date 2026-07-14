import { cn } from '@/lib/cn';

export interface PaginationProps {
  currentPage: number;   // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const pageButtonBase =
  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const pageButtonVariant = 'border border-border bg-transparent text-ink hover:bg-surface';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      <button
        type="button"
        aria-label="First page"
        disabled={isFirst}
        onClick={() => onPageChange(1)}
        className={cn(pageButtonBase, pageButtonVariant)}
      >
        First
      </button>

      <button
        type="button"
        aria-label="Previous page"
        disabled={isFirst}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(pageButtonBase, pageButtonVariant)}
      >
        Prev
      </button>

      <span
        aria-current="page"
        aria-live="polite"
        className="px-3 py-1.5 text-sm text-ink-muted select-none"
      >
        page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        aria-label="Next page"
        disabled={isLast}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(pageButtonBase, pageButtonVariant)}
      >
        Next
      </button>

      <button
        type="button"
        aria-label="Last page"
        disabled={isLast}
        onClick={() => onPageChange(totalPages)}
        className={cn(pageButtonBase, pageButtonVariant)}
      >
        Last
      </button>
    </nav>
  );
}
