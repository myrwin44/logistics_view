/**
 * ScheduleViewPage — trang xem lịch xe dạng Gantt Chart.
 * Date range được lấy từ globalDateRange (Zustand store).
 * Dữ liệu được fetch tự động qua useGanttSchedule (TanStack Query).
 */

import * as React from 'react';
import { Calendar, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GanttChart } from './GanttChart';
import { useUIStore } from '@/store/uiStore';
import { useGanttSchedule } from '@/hooks/useGanttSchedule';
import { CollapsibleFilterRibbon } from '@/components/shared/CollapsibleFilterRibbon';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScheduleViewPage() {
  // ── Global date range from Zustand ──
  const { globalDateRange } = useUIStore();
  const { startDate, endDate } = globalDateRange;

  // ── Local plate filter state ──
  const [filterPlate, setFilterPlate] = React.useState('');

  // ── Fetch via TanStack Query ──
  const { data: vehicles, isLoading, error, refetch } = useGanttSchedule({ startDate, endDate });

  // ── Filtered vehicles ──
  const filteredVehicles = React.useMemo(() => {
    if (!filterPlate.trim()) return vehicles;
    const q = filterPlate.trim().toLowerCase();
    return vehicles.filter((vs) => vs.licensePlate.toLowerCase().includes(q));
  }, [vehicles, filterPlate]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header ── */}
      <header className="flex items-center gap-2">
        <Calendar size={16} className="text-[#FFBF00] shrink-0" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-[#111827]">Xem lịch xe</h1>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-[#6B7280]">Lịch trình thời gian</span>
      </header>

      {/* ── Plate filter (only local filter remaining) ── */}
      <CollapsibleFilterRibbon label="Bộ lọc lịch xe">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="gantt-filter-plate" className="text-xs font-medium text-slate-600">
              Lọc biển số
            </Label>
            <Input
              id="gantt-filter-plate"
              type="text"
              placeholder="Nhập biển số..."
              value={filterPlate}
              onChange={(e) => setFilterPlate(e.target.value)}
              className="h-8 w-44 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1 self-end pb-0.5">
            <span className="text-xs text-slate-400">
              Khoảng thời gian: <strong className="text-slate-600">{startDate} → {endDate}</strong>
            </span>
          </div>
        </div>
      </CollapsibleFilterRibbon>

      {/* ── Error indicator — show when fetch failed ── */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          role="alert"
          aria-label="Lỗi tải dữ liệu"
        >
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Không thể tải dữ liệu lịch xe</p>
            <p className="text-sm text-red-600 mt-0.5">{error.message}</p>
            {/* Show stale data notice if we still have old data */}
            {vehicles.length > 0 && (
              <p className="text-xs text-red-500 mt-1">
                Đang hiển thị dữ liệu cũ. Nhấn "Thử lại" để cập nhật.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0 h-8 text-xs gap-1.5 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw size={12} />
            Thử lại
          </Button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#FFBF00]" />
          <span className="text-sm">Đang tải dữ liệu lịch xe...</span>
        </div>
      )}

      {/* ── Empty state (loaded successfully, no data) ── */}
      {!isLoading && !error && vehicles.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 flex flex-col items-center text-center gap-2">
          <Calendar size={36} className="text-slate-300" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Không có dữ liệu</p>
          <p className="text-xs text-slate-400">
            Không tìm thấy lịch xe trong khoảng thời gian đã chọn.
          </p>
        </div>
      )}

      {/* ── No-match filter state ── */}
      {!isLoading && vehicles.length > 0 && filteredVehicles.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
          <p className="text-sm text-slate-500">
            Không tìm thấy xe khớp với biển số <strong>{filterPlate}</strong>.
          </p>
        </div>
      )}

      {/* ── Gantt Chart — shown when we have data (even with stale error) ── */}
      {filteredVehicles.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          {/* Summary info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Lịch trình xe</span>
              <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                {filteredVehicles.length} xe
              </span>
              {/* Stale data badge when error exists but old data is displayed */}
              {error && (
                <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle size={10} aria-hidden />
                  Dữ liệu cũ
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {startDate} → {endDate}
            </span>
          </div>

          <GanttChart vehicles={filteredVehicles} />
        </div>
      )}

      {/* ── Prompt when no date range is set yet ── */}
      {!startDate && !endDate && !isLoading && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 flex flex-col items-center text-center gap-2">
          <Calendar size={40} className="text-slate-200" aria-hidden />
          <p className="text-sm font-medium text-slate-500">
            Chọn khoảng thời gian trên thanh tiêu đề để xem lịch xe
          </p>
          <p className="text-xs text-slate-400">
            Gantt Chart sẽ tự động hiển thị sau khi bạn áp dụng khoảng thời gian.
          </p>
        </div>
      )}
    </div>
  );
}
