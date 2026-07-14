/**
 * DateRangeFilter — reusable date range filter fieldset.
 */



export interface DateRangeFilterProps {
  /** ISO YYYY-MM-DD string or empty string. */
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  /** When truthy, displayed below inputs with error border applied. */
  error?: string;
  /** Whether to show the Clear button. Typically true when a date is committed. */
  showClear: boolean;
  /** ID for start date input (accessibility). */
  startId: string;
  /** ID for end date input (accessibility). */
  endId: string;
  /** Legend text for the fieldset. Defaults to "Date Range". */
  legend?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  error,
  showClear,
  startId,
  endId,
  legend = 'Date Range',
}: DateRangeFilterProps) {
  const errorId = `${startId}-error`;
  const hasError = Boolean(error);

  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
        {legend}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <label htmlFor={startId} className="sr-only">
            Start date
          </label>
          <input
            id={startId}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            aria-describedby={hasError ? errorId : undefined}
            className={
              `rounded-md border px-3 py-1.5 text-sm text-ink bg-white ` +
              `focus:outline-none focus:ring-2 focus:ring-[#FFBF00] ` +
              (hasError ? 'border-red-400' : 'border-border')
            }
          />
        </div>
        <span className="text-ink-muted text-sm" aria-hidden="true">to</span>
        <div className="flex flex-col gap-0.5">
          <label htmlFor={endId} className="sr-only">
            End date
          </label>
          <input
            id={endId}
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            aria-describedby={hasError ? errorId : undefined}
            className={
              `rounded-md border px-3 py-1.5 text-sm text-ink bg-white ` +
              `focus:outline-none focus:ring-2 focus:ring-[#FFBF00] ` +
              (hasError ? 'border-red-400' : 'border-border')
            }
          />
        </div>
        <button
          type="button"
          onClick={onApply}
          className={
            `inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink ` +
            `hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00]`
          }
        >
          Apply
        </button>
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className={
              `inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 text-sm text-ink-muted ` +
              `hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00]`
            }
          >
            Clear
          </button>
        )}
      </div>
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-600 mt-1"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
