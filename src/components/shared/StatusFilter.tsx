/**
 * StatusFilter — generic multi-select status toggle button group.
 */

export interface StatusFilterProps<T extends string> {
  /** The full list of status options to render as toggle buttons. */
  options: T[];
  /** The currently active selections. */
  selected: T[];
  /** Called when the user toggles a single option. */
  onToggle: (status: T) => void;
  /** Legend text for the fieldset. Defaults to "Status". */
  legend?: string;
}

export function StatusFilter<T extends string>({
  options,
  selected,
  onToggle,
  legend = 'Status',
}: StatusFilterProps<T>) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={
                `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ` +
                `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ` +
                (active
                  ? 'bg-primary text-brand-dark border-primary'
                  : 'bg-white text-ink-muted border-border hover:border-primary hover:text-brand-dark')
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
