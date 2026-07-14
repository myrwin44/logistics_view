/**
 * GanttChart — Hiển thị lịch trình xe dạng Gantt Chart.
 * - Trục Y: danh sách xe (biển số)
 * - Trục X: timeline (phân theo ngày / giờ)
 * - Thanh xanh lá  = idle (đứng tại kho)
 * - Thanh xanh dương = moving (đang di chuyển)
 * - Hover tooltip: hiện thông tin chi tiết IdleTripSchedule / MovingTripSchedule
 */

import * as React from 'react';
import type { VehicleSchedule, IdleTripSchedule, MovingTripSchedule } from '@/types/schedule';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_IDLE = '#283F24';       // xanh lá — idle / tại kho
const COLOR_MOVING = '#FFBF00';     // xanh dương — moving / di chuyển
const COLOR_IDLE_BORDER = '#A5C89E';
const COLOR_MOVING_BORDER = '#D92243';
const ROW_HEIGHT = 38;
const HEADER_HEIGHT = 56;
const LABEL_WIDTH = 100;
const MIN_BAR_PX = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

type BarType = 'idle' | 'moving';

interface GanttBar {
  type: BarType;
  startMs: number;
  endMs: number;
  label: string;
  data: IdleTripSchedule | MovingTripSchedule;
}

interface TooltipState {
  bar: GanttBar;
  x: number;
  y: number;
}

export interface GanttChartProps {
  vehicles: VehicleSchedule[];
  /** px per millisecond — controls zoom level */
  pxPerMs?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

/** Format datetime : DD/MM HH:mm */
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min}`;
}

/** Format số phút thành chuỗi "X giờ Y phút" */
function fmtMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/** Format số theo locale VN */
function fmtNum(n: number): string {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

/** Tính các thanh Gantt cho một xe */
function buildBars(vs: VehicleSchedule): GanttBar[] {
  const bars: GanttBar[] = [];

  for (const trip of vs.trips) {
    for (const idle of trip.idleTripSchedules) {
      bars.push({
        type: 'idle',
        startMs: toMs(idle.checkIn),
        endMs: toMs(idle.checkOut),
        label: idle.warehouseName,
        data: idle,
      });
    }

    for (const mov of trip.movingTripSchedules) {
      bars.push({
        type: 'moving',
        startMs: toMs(mov.departure),
        endMs: toMs(mov.arrival),
        label: `${mov.originWarehouse} → ${mov.destinationWarehouse}`,
        data: mov,
      });
    }
  }

  return bars.sort((a, b) => a.startMs - b.startMs);
}

/** Extract biển số xe từ một VehicleSchedule */
function getLicensePlate(vs: VehicleSchedule): string {
  return vs.licensePlate || 'Unknown';
}

/** Tạo danh sách mốc thời gian (mỗi 6h) cho axis X */
function buildTimeTicks(startMs: number, endMs: number): Array<{ ms: number; label: string; isDay: boolean }> {
  const INTERVAL = 6 * 3600 * 1000; // 6 hours
  const ticks: Array<{ ms: number; label: string; isDay: boolean }> = [];

  // Snap to nearest 6h boundary from UTC+7
  const tzOffset = 7 * 3600 * 1000;
  const snapped = Math.ceil((startMs + tzOffset) / INTERVAL) * INTERVAL - tzOffset;

  for (let ms = snapped; ms <= endMs; ms += INTERVAL) {
    const d = new Date(ms);
    const h = d.getHours();
    const isDay = h === 0;
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const label = isDay
      ? `${dd}/${mo}`
      : `${String(h).padStart(2, '0')}:00`;
    ticks.push({ ms, label, isDay });
  }

  return ticks;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function IdleTooltipContent({ data }: { data: IdleTripSchedule }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: COLOR_IDLE, border: `1px solid ${COLOR_IDLE_BORDER}` }}
        />
        <span className="font-semibold text-[#1e293b]">Điểm dừng</span>
      </div>
      <InfoRow label="Kho" value={data.warehouseName} />
      <InfoRow label="Vào" value={fmtDateTime(data.checkIn)} />
      <InfoRow label="Ra" value={fmtDateTime(data.checkOut)} />
      <InfoRow label="Thời gian" value={fmtMinutes(data.totalTime)} />
      <div className="border-t border-slate-200 pt-1.5 mt-1.5 space-y-1">
        <InfoRow label="Nhập — bill" value={`${fmtNum(data.totalUploadBill)} bill`} />
        <InfoRow label="Nhập — trọng" value={`${fmtNum(data.totalUploadWeight)} kg`} />
        <InfoRow label="Xuất — bill" value={`${fmtNum(data.totalDownloadBill)} bill`} />
        <InfoRow label="Xuất — trọng" value={`${fmtNum(data.totalDownloadWeight)} kg`} />
      </div>
    </div>
  );
}

function MovingTooltipContent({ data }: { data: MovingTripSchedule }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: COLOR_MOVING, border: `1px solid ${COLOR_MOVING_BORDER}` }}
        />
        <span className="font-semibold text-[#1e293b]">Đang di chuyển</span>
      </div>
      <InfoRow label="Xuất phát" value={data.originWarehouse} />
      <InfoRow label="Đến" value={data.destinationWarehouse} />
      <InfoRow label="Khởi hành" value={fmtDateTime(data.departure)} />
      <InfoRow label="Đến nơi" value={fmtDateTime(data.arrival)} />
      <InfoRow label="Thời gian" value={fmtMinutes(data.totalTime)} />
      <div className="border-t border-slate-200 pt-1.5 mt-1.5 space-y-1">
        <InfoRow label="Số bill" value={`${fmtNum(data.totalBill)}`} />
        <InfoRow label="Tổng tải" value={`${fmtNum(data.totalLoad)} kg`} />
        {data.distance > 0 && <InfoRow label="Khoảng cách" value={`${fmtNum(data.distance)} km`} />}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-slate-500 shrink-0 w-24 text-right">{label}:</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GanttChart({ vehicles, pxPerMs }: GanttChartProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // ── Compute global time range ──
  const { globalStart, globalEnd } = React.useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const vs of vehicles) {
      for (const trip of vs.trips) {
        for (const idle of trip.idleTripSchedules) {
          min = Math.min(min, toMs(idle.checkIn));
          max = Math.max(max, toMs(idle.checkOut));
        }
        for (const mov of trip.movingTripSchedules) {
          min = Math.min(min, toMs(mov.departure));
          max = Math.max(max, toMs(mov.arrival));
        }
      }
    }
    // Snap to day boundaries (UTC+7)
    const tzOff = 7 * 3600 * 1000;
    const dayMs = 86400 * 1000;
    const startSnap = Math.floor((min + tzOff) / dayMs) * dayMs - tzOff;
    const endSnap = Math.ceil((max + tzOff) / dayMs) * dayMs - tzOff;
    return { globalStart: startSnap, globalEnd: endSnap };
  }, [vehicles]);

  const totalMs = globalEnd - globalStart;

  // Default zoom: fit within viewport (min 120px per day, max auto)
  const resolvedPxPerMs = pxPerMs ?? Math.max(120 / 86400000, 1 / 300000);
  const timelineWidth = Math.max(800, totalMs * resolvedPxPerMs);

  const ticks = React.useMemo(
    () => buildTimeTicks(globalStart, globalEnd),
    [globalStart, globalEnd]
  );

  // ── Tooltip hide on outside click ──
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Không có dữ liệu lịch xe.
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="relative select-none" style={{ fontFamily: 'inherit' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <span className="text-xs font-medium text-slate-500">Chú thích:</span>
        <LegendItem color={COLOR_MOVING} borderColor={COLOR_MOVING_BORDER} label="Di chuyển" />
        <LegendItem color={COLOR_IDLE} borderColor={COLOR_IDLE_BORDER} label="Dừng tại kho" />
      </div>

      {/* Scrollable chart area */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        <div style={{ display: 'flex', minWidth: LABEL_WIDTH + timelineWidth }}>
          {/* ── Left label column ── */}
          <div
            className="shrink-0 bg-slate-50 border-r border-slate-200 z-10"
            style={{
              width: LABEL_WIDTH,
              position: 'sticky',
              left: 0,
            }}
          >
            {/* Header spacer */}
            <div
              style={{ height: HEADER_HEIGHT }}
              className="border-b border-slate-200 flex items-end pb-2 px-2"
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Xe</span>
            </div>

            {/* Vehicle rows */}
            {vehicles.map((vs, i) => {
              const plate = getLicensePlate(vs);
              return (
                <div
                  key={plate + i}
                  style={{ height: ROW_HEIGHT }}
                  className={`flex items-center px-2 border-b border-slate-100 ${
                    i % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-700 truncate" title={plate}>
                    {plate}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Timeline area ── */}
          <div style={{ flex: 1, position: 'relative', minWidth: timelineWidth }}>
            {/* Time axis header */}
            <div
              style={{ height: HEADER_HEIGHT, position: 'sticky', top: 0, zIndex: 5 }}
              className="bg-slate-50 border-b border-slate-200"
            >
              {ticks.map((tick) => {
                const x = (tick.ms - globalStart) * resolvedPxPerMs;
                return (
                  <div
                    key={tick.ms}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: 0,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 4,
                        whiteSpace: 'nowrap',
                      }}
                      className={`text-[10px] font-${tick.isDay ? 'bold' : 'medium'} ${
                        tick.isDay ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {tick.label}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: tick.isDay ? 1.5 : 1,
                        height: tick.isDay ? 20 : 12,
                        background: tick.isDay ? '#64748b' : '#cbd5e1',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Vehicle rows with bars */}
            {vehicles.map((vs, rowIdx) => {
              const bars = buildBars(vs);
              const plate = getLicensePlate(vs);

              return (
                <div
                  key={plate + rowIdx}
                  style={{
                    height: ROW_HEIGHT,
                    position: 'relative',
                    background: rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff',
                  }}
                  className="border-b border-slate-100"
                >
                  {/* Vertical grid lines (at day boundaries) */}
                  {ticks
                    .filter((t) => t.isDay)
                    .map((tick) => (
                      <div
                        key={tick.ms}
                        style={{
                          position: 'absolute',
                          left: (tick.ms - globalStart) * resolvedPxPerMs,
                          top: 0,
                          width: 1,
                          height: '100%',
                          background: '#e2e8f0',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}

                  {/* 6h sub-grid */}
                  {ticks
                    .filter((t) => !t.isDay)
                    .map((tick) => (
                      <div
                        key={tick.ms}
                        style={{
                          position: 'absolute',
                          left: (tick.ms - globalStart) * resolvedPxPerMs,
                          top: 0,
                          width: 1,
                          height: '100%',
                          background: '#f1f5f9',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}

                  {/* Gantt bars */}
                  {bars.map((bar, barIdx) => {
                    const left = (bar.startMs - globalStart) * resolvedPxPerMs;
                    const width = Math.max(MIN_BAR_PX, (bar.endMs - bar.startMs) * resolvedPxPerMs);
                    const isIdle = bar.type === 'idle';
                    const bgColor = isIdle ? COLOR_IDLE : COLOR_MOVING;
                    const borderColor = isIdle ? COLOR_IDLE_BORDER : COLOR_MOVING_BORDER;
                    const isActive = tooltip?.bar === bar;
                    const PAD = 4;

                    return (
                      <div
                        key={barIdx}
                        style={{
                          position: 'absolute',
                          left,
                          top: PAD,
                          width,
                          height: ROW_HEIGHT - PAD * 2,
                          backgroundColor: bgColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 3,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          opacity: isActive ? 1 : 0.88,
                          boxShadow: isActive
                            ? `0 0 0 2px ${borderColor}, 0 2px 8px rgba(0,0,0,0.15)`
                            : '0 1px 2px rgba(0,0,0,0.08)',
                          transition: 'opacity 0.15s, box-shadow 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: isActive ? 3 : 1,
                        }}
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const scrollEl = scrollRef.current;
                          const scrollLeft = scrollEl ? scrollEl.scrollLeft : 0;
                          const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
                          const containerRect = scrollEl?.getBoundingClientRect();
                          setTooltip({
                            bar,
                            x: rect.left - (containerRect?.left ?? 0) + scrollLeft + width / 2,
                            y: rect.top - (containerRect?.top ?? 0) + scrollTop,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const scrollEl = scrollRef.current;
                          const scrollLeft = scrollEl ? scrollEl.scrollLeft : 0;
                          const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
                          const containerRect = scrollEl?.getBoundingClientRect();
                          setTooltip((prev) =>
                            prev?.bar === bar
                              ? null
                              : {
                                  bar,
                                  x: rect.left - (containerRect?.left ?? 0) + scrollLeft + width / 2,
                                  y: rect.top - (containerRect?.top ?? 0) + scrollTop,
                                }
                          );
                        }}
                        role="button"
                        aria-label={`${isIdle ? 'Điểm dừng' : 'Di chuyển'}: ${bar.label}`}
                        tabIndex={0}
                      >
                        {/* Bar label — only shown if bar is wide enough */}
                        {width > 40 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#FFFBB1',
                              fontWeight: 600,
                              paddingLeft: 4,
                              paddingRight: 4,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2,
                              pointerEvents: 'none',
                            }}
                          >
                            {bar.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <TooltipCard
          tooltip={tooltip}
          containerRef={scrollRef}
          tooltipRef={tooltipRef}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  );
}

// ─── Tooltip card ────────────────────────────────────────────────────────────

interface TooltipCardProps {
  tooltip: TooltipState;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

function TooltipCard({ tooltip, containerRef, tooltipRef, onClose }: TooltipCardProps) {
  const TOOLTIP_WIDTH = 280;
  const containerRect = containerRef.current?.getBoundingClientRect();
  const containerWidth = containerRect?.width ?? window.innerWidth;

  // Position tooltip: prefer right of bar, flip left if out of bounds
  let left = tooltip.x - TOOLTIP_WIDTH / 2;
  if (left + TOOLTIP_WIDTH > containerWidth - 8) left = containerWidth - TOOLTIP_WIDTH - 8;
  if (left < 8) left = 8;

  const top = tooltip.y - 8; // slightly above the bar

  const isIdle = tooltip.bar.type === 'idle';

  return (
    <div
      ref={(el) => { (tooltipRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translateY(-100%)',
        zIndex: 50,
        width: TOOLTIP_WIDTH,
        pointerEvents: 'auto',
      }}
      className="bg-white rounded-xl shadow-2xl border border-slate-200 p-3"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Đóng tooltip"
        style={{ fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ×
      </button>

      {isIdle ? (
        <IdleTooltipContent data={tooltip.bar.data as IdleTripSchedule} />
      ) : (
        <MovingTooltipContent data={tooltip.bar.data as MovingTripSchedule} />
      )}
    </div>
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendItem({ color, borderColor, label }: { color: string; borderColor: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-3 rounded-sm"
        style={{ backgroundColor: color, border: `1px solid ${borderColor}` }}
      />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

export default GanttChart;
