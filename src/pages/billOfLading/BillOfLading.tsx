/**
 * BillOfLading page — paginated, sortable, filterable list of shipment bills.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';

import { useBills } from '@/hooks/useBills';
import type { BillListItem, BillStatus, BillSortField } from '@/types/billOfLading';
import type { SortDir } from '@/types/transportTrip';

import { buildBillColumns } from './BillColumns';
import { BillFilters } from './BillFilters';

const BILL_STATUSES: BillStatus[] = ['Unscheduled', 'Scheduled', 'In Transit', 'Delivered'];

export default function BillOfLading() {
  const navigate = useNavigate();

  const {
    data, totalPages, isLoading, error, refetch,
    page, sortField, sortDir,
    statuses, startDate, endDate, origin, destination,
    setPage, setSort, setFilters,
  } = useBills();

  const columns = React.useMemo(() => buildBillColumns(), []);

  function handleRowClick(row: BillListItem) {
    navigate(`/bills/${row.id}`);
  }

  function handleSortChange(field: string, dir: 'asc' | 'desc' | undefined) {
    setSort(field as BillSortField, dir as SortDir | undefined);
  }

  // Active filter description for empty state
  const activeFilterParts: string[] = [];
  if (statuses && statuses.length > 0) activeFilterParts.push(`status: ${statuses.join(', ')}`);
  if (startDate || endDate) {
    const parts: string[] = [];
    if (startDate) parts.push(`from ${startDate}`);
    if (endDate) parts.push(`to ${endDate}`);
    activeFilterParts.push(parts.join(' '));
  }
  if (origin) activeFilterParts.push(`origin: ${origin}`);
  if (destination) activeFilterParts.push(`destination: ${destination}`);
  const activeFilterText = activeFilterParts.length > 0
    ? `Active filters: ${activeFilterParts.join(' · ')}. Try adjusting your filters.`
    : 'Try adjusting your filters.';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bills of Lading"
        description="Browse and filter all shipment bills."
      />

      <BillFilters
        options={BILL_STATUSES}
        statuses={statuses}
        startDate={startDate}
        endDate={endDate}
        origin={origin}
        destination={destination}
        onStatusToggle={(status) => {
          const current = statuses ?? [];
          const next = current.includes(status)
            ? current.filter((s) => s !== status)
            : [...current, status];
          setFilters({ statuses: next.length > 0 ? next : [] });
        }}
        onDateApply={(start, end) => setFilters({ startDate: start || undefined, endDate: end || undefined })}
        onDateClear={() => setFilters({ startDate: undefined, endDate: undefined })}
        onOriginApply={(value) => setFilters({ origin: value || undefined })}
        onOriginClear={() => setFilters({ origin: undefined })}
        onDestinationApply={(value) => setFilters({ destination: value || undefined })}
        onDestinationClear={() => setFilters({ destination: undefined })}
      />

      {error !== null && !isLoading && (
        <ErrorState
          message="Failed to load shipment bills. Please try again."
          onRetry={refetch}
        />
      )}

      {error === null && (
        <>
          <div className="rounded-lg border border-border overflow-x-auto">
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
                  icon={FileText as React.ComponentType<{ size?: number; className?: string }>}
                  heading="No shipment bills found"
                  description={activeFilterText}
                />
              }
            />
          </div>
          {totalPages > 0 && (
            <div className="flex justify-end">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
