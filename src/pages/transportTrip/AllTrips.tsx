/**
 * AllTrips (Thông tin tuyến) — Danh sách tất cả chuyến xe.
 */
import * as React from 'react';
import { Truck, ArrowRight, ListFilter, Search, X } from 'lucide-react';
import type { TripOverview } from '@/types/transportTrip';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/uiStore';
import { Pagination } from '@/components/shared/Pagination';
import { useAllTrips } from './useAllTrips';
import { TripDetailPanel } from './TripDetailPanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableToolbar } from '@/components/shared/TableToolbar';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatDateTimeShort, stripWarehousePrefix } from '@/lib/format';

function TripRow({ trip, isSelected, onClick }: {
  trip: TripOverview; isSelected: boolean; onClick: () => void;
}) {
  return (
    <tr onClick={onClick} className={cn(
      'cursor-pointer border-b border-slate-100 transition-colors',
      isSelected ? 'bg-[#EEF5FF] hover:bg-[#E4EFFF]' : 'hover:bg-slate-50',
    )}>
      <td className="py-2 pl-4 pr-2">
        <span className="text-xs font-semibold text-slate-800">{trip.licensePlate}</span>
      </td>
      <td className="py-2 px-2">
        <span className="text-xs font-mono text-brand-mid font-medium">{trip.id}</span>
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <span className="truncate max-w-[100px]" title={trip.originWarehouse}>{stripWarehousePrefix(trip.originWarehouse)}</span>
          <ArrowRight size={10} className="text-slate-300 shrink-0" />
          <span className="truncate max-w-[100px]" title={trip.destinationWarehouse}>{stripWarehousePrefix(trip.destinationWarehouse)}</span>
        </div>
      </td>
      <td className="py-2 px-2">
        <span className="text-xs tabular-nums text-slate-600">{formatDateTimeShort(trip.departure)}</span>
      </td>
      <td className="py-2 px-2 text-right">
        <span className="text-xs tabular-nums font-medium text-slate-700">{trip.noStops}</span>
      </td>
      <td className="py-2 pl-2 pr-4 text-right">
        <span className="text-xs tabular-nums font-medium text-slate-700">{trip.totalBill.toLocaleString()}</span>
      </td>
    </tr>
  );
}

export default function AllTrips() {
  const { globalDateRange } = useUIStore();
  const { startDate, endDate } = globalDateRange;
  const [page, setPage] = React.useState(1);
  const { trips, totalPages, isLoading, error } = useAllTrips({ startDate, endDate, page });
  const [filterPlate, setFilterPlate] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Reset page 1 when date range changes
  const prevDateRange = React.useRef({ startDate, endDate });
  React.useEffect(() => {
    const prev = prevDateRange.current;
    if (prev.startDate !== startDate || prev.endDate !== endDate) {
      prevDateRange.current = { startDate, endDate };
      setPage(1);
      setSelectedId(null);
    }
  }, [startDate, endDate]);

  const displayTrips = React.useMemo(() => {
    if (!filterPlate.trim()) return trips;
    const q = filterPlate.toLowerCase().trim();
    return trips.filter(t => t.licensePlate.toLowerCase().includes(q));
  }, [trips, filterPlate]);

  const hasData = trips.length > 0;
  const showErrorBanner = !!error && hasData;
  const showErrorState = !!error && !hasData && !isLoading;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader icon={Truck} title="Thông tin tuyến" description="Danh sách chuyến xe theo khoảng thời gian" />

      <div className="flex items-center gap-2">
        <label htmlFor="at-plate" className="flex items-center gap-1 text-xs font-medium text-slate-600 shrink-0">
          <ListFilter size={11} /> Lọc biển số
        </label>
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input id="at-plate" type="text" placeholder="Biển số..."
            value={filterPlate} onChange={e => setFilterPlate(e.target.value)}
            className="h-8 text-xs w-40 pl-6" />
        </div>
        {filterPlate && (
          <button onClick={() => setFilterPlate('')}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
            <X size={11} /> Xóa
          </button>
        )}
      </div>

      {showErrorBanner && (
        <ErrorState variant="banner" message={`Không thể tải dữ liệu mới. Đang hiển thị dữ liệu cũ. (${error.message})`} />
      )}
      {showErrorState && <ErrorState variant="inline" message={error.message} />}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <TableToolbar
          title="Danh sách chuyến"
          isLoading={isLoading}
          pageInfo={!isLoading && trips.length > 0 ? `trang ${page}/${totalPages}` : undefined}
          filterInfo={filterPlate.trim() && displayTrips.length !== trips.length ? `lọc: ${displayTrips.length}` : undefined}
          dateRange={(startDate || endDate) ? `${startDate} → ${endDate}` : undefined}
        />

        {isLoading && !hasData && <LoadingState variant="full" />}

        {!isLoading && !error && displayTrips.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400 text-sm">
            <Truck size={32} className="text-slate-200" />
            <span>Không tìm thấy chuyến xe nào.</span>
          </div>
        )}

        {displayTrips.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Biển số', 'Mã chuyến', 'Kho đầu → Kho cuối', 'Khởi hành', 'Điểm dừng', 'Bills'].map(h => (
                    <th key={h} className="py-2 px-2 first:pl-4 last:pr-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayTrips.map(trip => (
                  <React.Fragment key={trip.id}>
                    <TripRow
                      trip={trip}
                      isSelected={selectedId === trip.id}
                      onClick={() => setSelectedId(prev => prev === trip.id ? null : trip.id)}
                    />
                    {selectedId === trip.id && (
                      <tr><td colSpan={6} className="p-0">
                        <TripDetailPanel tripId={trip.id} onClose={() => setSelectedId(null)} />
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center py-3 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
