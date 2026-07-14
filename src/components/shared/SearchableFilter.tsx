/**
 * SearchableFilter — reusable searchable text filter fieldset.
 */

export interface SearchableFilterProps {
  /** Unique ID for the search input — also used as the `htmlFor` on the sr-only label. */
  id: string;
  /** Legend text rendered above the input. */
  legend: string;
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Current (uncommitted) input value. */
  value: string;
  /** Called on every keystroke. */
  onChange: (value: string) => void;
  /** Called when the user clicks Apply or presses Enter (Req 3.4). */
  onApply: () => void;
  /** Called when the user clicks Clear. */
  onClear: () => void;
  /** Whether to show the Clear button. Typically true when a filter is committed. */
  showClear: boolean;
}

export function SearchableFilter({
  id,
  legend,
  placeholder,
  value,
  onChange,
  onApply,
  onClear,
  showClear,
}: SearchableFilterProps) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
        {legend}
      </legend>
      <div className="flex items-center gap-2">
        {/* sr-only label links to the input for accessibility */}
        <label htmlFor={id} className="sr-only">
          {legend}
        </label>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply();
          }}
          placeholder={placeholder}
          className={
            `rounded-md border px-3 py-1.5 text-sm text-ink bg-white w-44 ` +
            `focus:outline-none focus:ring-2 focus:ring-[#FFBF00] border-border`
          }
        />
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
    </fieldset>
  );
}
