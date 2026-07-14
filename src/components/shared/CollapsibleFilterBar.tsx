/**
 * CollapsibleFilterBar — thanh bộ lọc có thể thu gọn dạng ribbon.
 *
 * - Mặc định mở rộng (expanded)
 * - Khi thu gọn chỉ hiển thị 1 dòng header mỏng với tóm tắt ngày hiện tại
 * - Animation slide + fade khi toggle
 * - Responsive: wrap controls tốt trên màn hình nhỏ
 */
import * as React from 'react';
import { ChevronDown, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CollapsibleFilterBarProps {
  /** Tóm tắt hiển thị khi thu gọn, ví dụ: "01/03 → 05/03/2026" */
  summary?: string;
  /** Tiêu đề thanh filter, mặc định là "Bộ lọc" */
  title?: string;
  /** Trạng thái mặc định */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleFilterBar({
  summary,
  title = 'Bộ lọc',
  defaultOpen = true,
  children,
  className,
}: CollapsibleFilterBarProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        'bg-white border border-border rounded-lg overflow-hidden transition-all duration-200',
        className,
      )}
    >
      {/* ── Header / Toggle bar ── */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'hover:bg-slate-50 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
          isOpen ? 'border-b border-border' : '',
        )}
      >
        {/* Icon */}
        <SlidersHorizontal
          size={13}
          className="text-primary shrink-0"
          aria-hidden
        />

        {/* Title */}
        <span className="text-xs font-semibold text-slate-600 select-none">
          {title}
        </span>

        {/* Summary — chỉ hiện khi đang thu gọn */}
        {!isOpen && summary && (
          <>
            <span className="text-slate-300 text-xs mx-1">·</span>
            <span className="flex items-center gap-1 text-xs text-brand-mid font-medium">
              <CalendarDays size={11} aria-hidden />
              {summary}
            </span>
          </>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Chevron */}
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(
            'shrink-0 text-slate-400 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      {/* ── Expandable body ── */}
      <div
        className={cn(
          'transition-all duration-200 ease-in-out',
          isOpen
            ? 'max-h-[240px] opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none',
        )}
        // max-h đủ lớn để chứa nội dung, nhưng không gây layout shift khi đóng
        aria-hidden={!isOpen}
      >
        <div className="px-3 py-2.5">{children}</div>
      </div>
    </div>
  );
}
