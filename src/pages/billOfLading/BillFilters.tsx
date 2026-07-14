/**
 * BillFilters — filter bar for the Bills of Lading page.
 */

import * as React from 'react';

import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { SearchableFilter } from '@/components/shared/SearchableFilter';
import { StatusFilter } from '@/components/shared/StatusFilter';
import type { BillStatus } from '@/types/billOfLading';

export interface BillFiltersProps {
  /** The full list of status options to display. */
  options: BillStatus[];
  /** Currently committed status filter values. */
  statuses: BillStatus[] | undefined;
  /** Currently committed start date (ISO YYYY-MM-DD or undefined). */
  startDate: string | undefined;
  /** Currently committed end date (ISO YYYY-MM-DD or undefined). */
  endDate: string | undefined;
  /** Currently committed origin filter. */
  origin: string | undefined;
  /** Currently committed destination filter. */
  destination: string | undefined;
  onStatusToggle: (status: BillStatus) => void;
  onDateApply: (start: string, end: string) => void;
  onDateClear: () => void;
  onOriginApply: (value: string) => void;
  onOriginClear: () => void;
  onDestinationApply: (value: string) => void;
  onDestinationClear: () => void;
}

export function BillFilters({
  options,
  statuses,
  startDate,
  endDate,
  origin,
  destination,
  onStatusToggle,
  onDateApply,
  onDateClear,
  onOriginApply,
  onOriginClear,
  onDestinationApply,
  onDestinationClear,
}: BillFiltersProps) {
  // ── Local uncommitted input state ─────────────────────────────────────────
  const [pickerStart, setPickerStart] = React.useState(startDate ?? '');
  const [pickerEnd, setPickerEnd] = React.useState(endDate ?? '');
  const [dateError, setDateError] = React.useState('');
  const [originInput, setOriginInput] = React.useState(origin ?? '');
  const [destinationInput, setDestinationInput] = React.useState(destination ?? '');

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleDateApply() {
    if (pickerStart && pickerEnd && pickerEnd < pickerStart) {
      setDateError('End date must be on or after start date.');
      return;
    }
    setDateError('');
    onDateApply(pickerStart, pickerEnd);
  }

  function handleDateClear() {
    setPickerStart('');
    setPickerEnd('');
    setDateError('');
    onDateClear();
  }

  function handleOriginApply() {
    onOriginApply(originInput.trim());
  }

  function handleOriginClear() {
    setOriginInput('');
    onOriginClear();
  }

  function handleDestinationApply() {
    onDestinationApply(destinationInput.trim());
  }

  function handleDestinationClear() {
    setDestinationInput('');
    onDestinationClear();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface px-4 py-3">
      <StatusFilter<BillStatus>
        options={options}
        selected={statuses ?? []}
        onToggle={onStatusToggle}
      />

      <DateRangeFilter
        startDate={pickerStart}
        endDate={pickerEnd}
        onStartDateChange={setPickerStart}
        onEndDateChange={setPickerEnd}
        onApply={handleDateApply}
        onClear={handleDateClear}
        showClear={Boolean(startDate || endDate)}
        startId="bill-start-date"
        endId="bill-end-date"
        legend="Scheduled Date Range"
        error={dateError}
      />

      <SearchableFilter
        id="bill-origin"
        legend="Origin Warehouse"
        placeholder="Search origin…"
        value={originInput}
        onChange={setOriginInput}
        onApply={handleOriginApply}
        onClear={handleOriginClear}
        showClear={Boolean(origin)}
      />

      <SearchableFilter
        id="bill-destination"
        legend="Destination Warehouse"
        placeholder="Search destination…"
        value={destinationInput}
        onChange={setDestinationInput}
        onApply={handleDestinationApply}
        onClear={handleDestinationClear}
        showClear={Boolean(destination)}
      />
    </div>
  );
}
