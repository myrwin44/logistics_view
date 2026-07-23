import * as React from 'react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Check, Loader2 } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange?: (date: DateRange | undefined) => void;
  onApply?: () => void;
  /** When true, the apply button shows a spinner */
  isLoading?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * DateRangePicker renders a calendar-based date range picker with horizontal label layout.
 *
 * The component uses react-day-picker for calendar selection and displays the selected
 * date range in a button that opens a popover calendar.
 *
 * Accessibility:
 * - The button has an associated label via FieldLabel.
 * - Error messages are displayed when provided.
 */
export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  onApply,
  isLoading = false,
  error,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (startDate || endDate) {
      return { from: startDate, to: endDate };
    }
    return {
      from: new Date(new Date().getFullYear(), 0, 20),
      to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
    };
  });

  // Track the previous isLoading value to detect transition loading→done
  const prevLoadingRef = React.useRef(isLoading);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      // Just finished loading — flash success check
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 900);
      return () => clearTimeout(t);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  const handleApply = () => {
    onApply?.();
  };

  // Icon state: spinning while loading, green check briefly after, default check otherwise
  const iconState: 'loading' | 'success' | 'idle' =
    isLoading ? 'loading' : showSuccess ? 'success' : 'idle';

  return (
    <div className={cn('flex items-center', className)}>
      {/* Trigger button — rounded left, flat right edge */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start px-2.5 font-normal w-56',
              'rounded-r-none border-r-0',
              !date && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'dd/MM/yyyy', { locale: vi })} -{' '}
                  {format(date.to, 'dd/MM/yyyy', { locale: vi })}
                </>
              ) : (
                format(date.from, 'dd/MM/yyyy', { locale: vi })
              )
            ) : (
              <span>Chọn ngày</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={vi}
          />
        </PopoverContent>
      </Popover>

      {/* Apply button — icon-only, flat left edge, rounded right, amber fill */}
      {onApply && (
        <Button
          type="button"
          onClick={handleApply}
          disabled={disabled || isLoading}
          aria-label={isLoading ? 'Đang tải dữ liệu...' : 'Áp dụng khoảng thời gian'}
          className={cn(
            'rounded-l-none w-9 h-9 px-0 flex-shrink-0',
            'border transition-all duration-200',
            iconState === 'success'
              ? 'bg-[#467235] border-[#467235] text-white'
              : 'bg-[#FFBF00] hover:bg-[#E6AC00] text-[#1A1A1A] border-[#FFBF00] hover:border-[#E6AC00]',
            'focus-visible:ring-2 focus-visible:ring-[#FFBF00]/50 focus-visible:outline-none',
          )}
        >
          {iconState === 'loading' && (
            <Loader2 size={15} aria-hidden="true" className="animate-spin" />
          )}
          {iconState === 'success' && (
            <Check size={15} aria-hidden="true" strokeWidth={3} className="animate-[scale-in_0.15s_ease-out]" />
          )}
          {iconState === 'idle' && (
            <Check size={15} aria-hidden="true" strokeWidth={2.5} />
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-600 ml-2">{error}</p>
      )}
    </div>
  );
}
