/**
 * SpatialSchedulePage — Trang Lịch trình không gian.
 * Date range được lấy từ globalDateRange (Zustand store).
 * Dữ liệu được autofetch qua useGanttSchedule (TanStack Query).
 */
import * as React from 'react';
import { Map, AlertCircle, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SpatialGanttChart } from './SpatialGanttChart';
import { useUIStore } from '@/store/uiStore';
import { useGanttSchedule } from '@/hooks/useGanttSchedule';
import { CollapsibleFilterRibbon } from '@/components/shared/CollapsibleFilterRibbon';

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpatialSchedulePage() {
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
        <Map size={16} className="text-[#FFBF00] shrink-0" aria-hidden />
        <h1 className="text-sm font-semibold text-[#111827]">Xem lộ trình xe</h1>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-[#6B7280]">Lịch trình địa lý</span>
      </header>

      {/* ── Plate filter + date range display (only local filter remaining) ── */}
      <CollapsibleFilterRibbon label="Bộ lọc lộ trình xe">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="sp-plate" className="text-xs font-medium text-slate-600">
              Lọc biển số
            </Label>
            <Input
              id="sp-plate"
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
            <p className="text-sm font-medium text-red-800">Không thể tải dữ liệu lịch trình</p>
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
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-10 flex justify-center items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#FFBF00]" />
          <span className="text-sm">Đang tải dữ liệu lịch trình...</span>
        </div>
      )}

      {/* ── Empty state (loaded successfully, no data) ── */}
      {!isLoading && !error && vehicles.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-10 flex flex-col items-center gap-3 text-center">
          <Calendar size={36} className="text-slate-200" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Không có dữ liệu</p>
          <p className="text-xs text-slate-400">Không tìm thấy tuyến xe trong khoảng thời gian đã chọn.</p>
        </div>
      )}

      {/* ── No-match filter state ── */}
      {!isLoading && vehicles.length > 0 && filteredVehicles.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center text-sm text-slate-500">
          Không tìm thấy xe khớp với biển số <strong>"{filterPlate}"</strong>.
        </div>
      )}

      {/* ── No date range set ── */}
      {!startDate && !endDate && !isLoading && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-10 flex flex-col items-center gap-3 text-center">
          <Map size={40} className="text-slate-200" aria-hidden />
          <p className="text-sm font-medium text-slate-500">
            Chọn khoảng thời gian trên thanh tiêu đề để xem lịch trình
          </p>
          <p className="text-xs text-slate-400">
            Sơ đồ không gian sẽ tự động hiển thị sau khi bạn áp dụng khoảng thời gian.
          </p>
        </div>
      )}

      {/* ── Spatial Chart — shown when we have data (even with stale error) ── */}
      {filteredVehicles.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
          {/* Chart Header / Legend */}
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Sơ đồ không gian</span>
              <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                {filteredVehicles.length} xe
              </span>
              <span className="text-xs text-slate-400">{startDate} → {endDate}</span>
              {/* Stale data badge when error exists but old data is displayed */}
              {error && (
                <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle size={10} aria-hidden />
                  Dữ liệu cũ
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center flex-wrap gap-5 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <svg width="28" height="10">
                  <line x1="0" y1="5" x2="22" y2="5" stroke="#458B73" strokeWidth="2.5" markerEnd="url(#leg-s)" />
                  <defs>
                    <marker id="leg-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                      <path d="M0,0 L10,5 L0,10 Z" fill="#458B73" />
                    </marker>
                  </defs>
                </svg>
                Vào Nam
              </div>
              <div className="flex items-center gap-2">
                <svg width="28" height="10">
                  <line x1="0" y1="5" x2="22" y2="5" stroke="#FF9760" strokeWidth="2.5" markerEnd="url(#leg-n)" />
                  <defs>
                    <marker id="leg-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                      <path d="M0,0 L10,5 L0,10 Z" fill="#FF9760" />
                    </marker>
                  </defs>
                </svg>
                Ra Bắc
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <span className="w-4 h-4 rounded-full bg-[#FEF08A] border-2 border-[#EAB308] inline-block" />
                Có biến động
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-white border-2 border-[#EF4444] inline-block" />
                Không biến động
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1">
            <SpatialGanttChart vehicles={filteredVehicles} />
          </div>
        </div>
      )}
    </div>
  );
}
