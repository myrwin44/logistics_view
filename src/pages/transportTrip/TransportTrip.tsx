/**
 * TransportTrip page — paginated, sortable, filterable list of transport trips.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CollapsibleFilterRibbon } from '@/components/shared/CollapsibleFilterRibbon';

import { useTransportTrips } from '@/hooks/useTransportTrips';

import type { TripListItem, TripStatus, TripSortField, SortDir } from '@/types/transportTrip';

// ─── Trip Status options ───────────────────────────────────────────────────────

const TRIP_STATUSES: TripStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

// ─── Column definitions ────────────────────────────────────────────────────────

function buildColumns(): ColumnDef<TripListItem>[] {
  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'Trip ID',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.id}</span>
      ),
    },
    {
      id: 'vehicleName',
      header: 'Vehicle',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-ink">{row.original.vehicle.name}</div>
          <div className="text-xs text-ink-muted">{row.original.vehicle.plateNumber}</div>
        </div>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'originWarehouse',
      accessorKey: 'originWarehouse',
      header: 'Origin',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.originWarehouse}</span>
      ),
    },
    {
      id: 'destinationWarehouse',
      accessorKey: 'destinationWarehouse',
      header: 'Destination',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.destinationWarehouse}</span>
      ),
    },
    {
      id: 'scheduledDate',
      accessorKey: 'scheduledDate',
      header: 'Date',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">
          {row.original.scheduledDate}
        </span>
      ),
    },
    {
      id: 'shipmentCount',
      accessorKey: 'shipmentCount',
      header: 'Bills',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink text-center block">
          {row.original.shipmentCount}
        </span>
      ),
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransportTrip() {
  const navigate = useNavigate();

  // Local date range state — TransportTrip manages its own date range
  // (AllTrips uses globalDateRange instead)
  const [pickerStart, setPickerStart] = React.useState('');
  const [pickerEnd, setPickerEnd] = React.useState('');

  const {
    trips: data,
    total: totalPages,
    isLoading,
    error,
    refetch,
    page,
    sortField,
    sortDir,
    statuses,
    setPage,
    setSortField,
    setSortDir,
    setStatuses: setStatusFilter,
  } = useTransportTrips({ startDate: pickerStart || undefined, endDate: pickerEnd || undefined });
  const [dateError, setDateError] = React.useState('');

  // ── Columns (memoised — dateFormat used for display) ─────────────────────
  const columns = React.useMemo(() => buildColumns(), []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleRowClick(row: TripListItem) {
    navigate(`/transport-trips/${row.id}`);
  }

  function handleSortChange(field: string, dir: 'asc' | 'desc' | undefined) {
    setSortField(field as TripSortField);
    setSortDir(dir as SortDir | undefined);
  }

  function handleStatusToggle(status: TripStatus) {
    const current = statuses ?? [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setStatusFilter(next.length > 0 ? next : undefined);
  }

  function handleDateApply() {
    if (pickerStart && pickerEnd && pickerEnd < pickerStart) {
      setDateError('End date must be on or after start date.');
      return;
    }
    setDateError('');
    // Date range is passed as params to useTransportTrips — local state drives re-query
  }

  function handleDateClear() {
    setPickerStart('');
    setPickerEnd('');
    setDateError('');
  }

  // ── Active filter description for empty state helper text ─────────────────
  const activeFilterParts: string[] = [];
  if (statuses && statuses.length > 0) {
    activeFilterParts.push(`status: ${statuses.join(', ')}`);
  }
  if (pickerStart || pickerEnd) {
    const parts = [];
    if (pickerStart) parts.push(`from ${pickerStart}`);
    if (pickerEnd) parts.push(`to ${pickerEnd}`);
    activeFilterParts.push(parts.join(' '));
  }
  const activeFilterText =
    activeFilterParts.length > 0
      ? `Active filters: ${activeFilterParts.join(' · ')}. Try adjusting your filters.`
      : 'Try adjusting your filters.';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Transport Trips</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Browse and filter all transport trips.
        </p>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <CollapsibleFilterRibbon label="Bộ lọc chuyến xe">
        <div className="flex flex-wrap items-end gap-4">

          {/* Status multi-select */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
              Status
            </legend>
            <div className="flex flex-wrap gap-2">
              {TRIP_STATUSES.map((s) => {
                const active = (statuses ?? []).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusToggle(s)}
                    aria-pressed={active}
                    className={
                      `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ` +
                      `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] ` +
                      (active
                        ? 'bg-[#FFBF00] text-[#283F24] font-semibold border-[#FFBF00]'
                        : 'bg-white text-ink-muted border-border hover:border-[#FFBF00] hover:text-[#283F24]')
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Date range filter */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
              Date Range
            </legend>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <label htmlFor="trip-start-date" className="sr-only">
                  Start date
                </label>
                <input
                  id="trip-start-date"
                  type="date"
                  value={pickerStart}
                  onChange={(e) => setPickerStart(e.target.value)}
                  aria-describedby={dateError ? 'trip-date-error' : undefined}
                  className={
                    `rounded-md border px-3 py-1.5 text-sm text-ink bg-white ` +
                    `focus:outline-none focus:ring-2 focus:ring-[#FFBF00] ` +
                    (dateError ? 'border-red-400' : 'border-border')
                  }
                />
              </div>
              <span className="text-ink-muted text-sm" aria-hidden="true">to</span>
              <div className="flex flex-col gap-0.5">
                <label htmlFor="trip-end-date" className="sr-only">
                  End date
                </label>
                <input
                  id="trip-end-date"
                  type="date"
                  value={pickerEnd}
                  onChange={(e) => setPickerEnd(e.target.value)}
                  aria-describedby={dateError ? 'trip-date-error' : undefined}
                  className={
                    `rounded-md border px-3 py-1.5 text-sm text-ink bg-white ` +
                    `focus:outline-none focus:ring-2 focus:ring-[#FFBF00] ` +
                    (dateError ? 'border-red-400' : 'border-border')
                  }
                />
              </div>
              <button
                type="button"
                onClick={handleDateApply}
                className={
                  `inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink ` +
                  `hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00]`
                }
              >
                Apply
              </button>
              {(pickerStart || pickerEnd) && (
                <button
                  type="button"
                  onClick={handleDateClear}
                  className={
                    `inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 text-sm text-ink-muted ` +
                    `hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00]`
                  }
                >
                  Clear
                </button>
              )}
            </div>
            {dateError && (
              <p
                id="trip-date-error"
                role="alert"
                className="text-xs text-red-600 mt-1"
              >
                {dateError}
              </p>
            )}
          </fieldset>
        </div>
      </CollapsibleFilterRibbon>

      {/* ── Error state ────────────────────────────────────────── */}
      {error !== null && !isLoading && (
        <ErrorState
          message="Failed to load transport trips. Please try again."
          onRetry={refetch}
        />
      )}

      {/* ── Table + pagination ────────────────── */}
      {error === null && (
        <>
          <div className="rounded-lg border border-border overflow-x-auto bg-white">
            <DataTable
              columns={columns}
              data={data}
              isLoading={isLoading}
              skeletonRows={25}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              onRowClick={handleRowClick}
              emptyState={
                <EmptyState
                  icon={Truck as React.ComponentType<{ size?: number; className?: string }>}
                  heading="No transport trips found"
                  description={activeFilterText}
                />
              }
            />
          </div>

          {/* Pagination — only render when we have pages */}
          {totalPages > 0 && (
            <div className="flex justify-end">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

