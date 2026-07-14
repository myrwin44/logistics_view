import * as React from 'react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start px-2.5 font-normal w-60',
              !date && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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
        <PopoverContent className="w-auto p-0" align="start">
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
      
      {onApply && (
        <Button
          type="button"
          variant="default"
          onClick={handleApply}
          disabled={disabled}
        >
          Áp dụng
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
