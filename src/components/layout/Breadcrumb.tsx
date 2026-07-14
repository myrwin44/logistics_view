import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="text-ink-muted shrink-0"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn('text-sm font-medium text-gray-800 truncate')}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href ?? '#'}
                  className={cn(
                    'text-sm text-ink-muted hover:text-gray-800 transition-colors shrink-0'
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
