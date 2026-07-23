import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { CollapsibleFilterRibbon } from '@/components/shared/CollapsibleFilterRibbon';

import { useBills } from '@/hooks/useBills';
import type { BillListItem, BillStatus, BillSortField } from '@/types/billOfLading';

import { buildBillColumns } from './BillColumns';
import { BillFilters } from './BillFilters';

const BILL_STATUSES: BillStatus[] = ['ESTIMATED', 'MODIFIED', 'ACTUAL'];

export default function BillOfLading() {
  const navigate = useNavigate();

  const {
    data, totalPages, isLoading, error, refetch,
    page, sortField,
    status, id, warehouseId, transportTripId,
    hasSearched,
    setPage, setSort, setFilters, clearFilters,
  } = useBills();

  const columns = React.useMemo(() => buildBillColumns(), []);
  const location = useLocation();

  function handleRowClick(row: BillListItem) {
    // Pass the current search string so the detail page can link back with full URL
    navigate(`/bills/${row.id}`, { state: { billsSearch: location.search } });
  }

  function handleSortChange(field: string, dir: 'asc' | 'desc' | undefined) {
    setSort(field as BillSortField, dir);
  }

  const activeFilterParts: string[] = [];
  if (status) activeFilterParts.push(`status: ${status}`);
  if (id) activeFilterParts.push(`id: ${id}`);
  if (warehouseId) activeFilterParts.push(`warehouseId: ${warehouseId}`);
  if (transportTripId) activeFilterParts.push(`transportTripId: ${transportTripId}`);
  const activeFilterText = activeFilterParts.length > 0
    ? `Active filters: ${activeFilterParts.join(' · ')}. Try adjusting your filters.`
    : 'Try adjusting your filters.';

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FileText}
        title="Vận đơn"
        description="Tìm và duyệt các đơn vận chuyển."
      />

      <CollapsibleFilterRibbon label="Bộ lọc vận đơn">
        <BillFilters
          options={BILL_STATUSES}
          status={status}
          id={id}
          warehouseId={warehouseId}
          transportTripId={transportTripId}
          onApply={(filters) => setFilters(filters)}
          onClear={clearFilters}
        />
      </CollapsibleFilterRibbon>

      {error !== null && !isLoading && (
        <ErrorState
          message="Không tải được vận đơn. Vui lòng thử lại."
          onRetry={refetch}
        />
      )}

      {/* Prompt — shown before the user has searched */}
      {!hasSearched && (
        <div className="rounded-lg border border-border bg-white p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center">
            <Search size={22} className="text-[#FFBF00]" />
          </div>
          <p className="text-sm font-medium text-slate-700">Chọn bộ lọc và nhấn <span className="font-semibold text-[#FFBF00]">Tìm</span> để xem vận đơn</p>
          <p className="text-xs text-slate-400">Kết quả sẽ hiển thị ở đây sau khi tìm kiếm.</p>
        </div>
      )}

      {error === null && hasSearched && (
        <>
          <div className="rounded-lg border border-border overflow-x-auto bg-white">
            <DataTable
              columns={columns}
              data={data}
              isLoading={isLoading}
              skeletonRows={25}
              sortField={sortField}
              sortDir="desc"
              onSortChange={handleSortChange}
              onRowClick={handleRowClick}
              emptyState={
                <EmptyState
                  icon={FileText as React.ComponentType<{ size?: number; className?: string }>}
                  heading="Không tìm thấy vận đơn."
                  description={activeFilterText}
                />
              }
            />
          </div>
          {totalPages > 0 && (
            <div className="flex justify-center pb-6">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
