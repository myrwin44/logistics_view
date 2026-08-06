/**
 * GanttChart — Hiển thị lịch trình xe dạng Gantt Chart.
 * - Trục Y: danh sách xe (biển số)
 * - Trục X: timeline (phân theo ngày / giờ)
 * - Thanh xanh lá  = idle (đứng tại kho)
 * - Thanh vàng = moving (đang di chuyển)
 * - Hover / click: tooltip cố định bằng position:fixed để không bị lệch
 */

import * as React from 'react';
import type { VehicleSchedule, IdleTripSchedule, MovingTripSchedule } from '@/types/schedule';
import {
  GanttTooltipCard,
  type GanttTipState,
} from '@/components/shared/GanttTooltip';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_IDLE    = '#283F24';
const COLOR_MOVING  = '#FFBF00';
const COLOR_IDLE_BORDER   = '#A5C89E';
const COLOR_MOVING_BORDER = '#D4A017';
const ROW_HEIGHT   = 32;
const HEADER_HEIGHT = 56;
const LABEL_WIDTH   = 100;
const MIN_BAR_PX    = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

type BarType = 'idle' | 'moving';

interface GanttBar {
  type: BarType;
  startMs: number;
  endMs: number;
  label: string;
  data: IdleTripSchedule | MovingTripSchedule;
}

export interface GanttChartProps {  vehicles: VehicleSchedule[];
  /** px per millisecond — controls zoom level */
  pxPerMs?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMs(iso: string): number { return new Date(iso).getTime(); }

function buildBars(vs: VehicleSchedule): GanttBar[] {
  const bars: GanttBar[] = [];
  for (const trip of vs.trips) {
    for (const idle of trip.idleTripSchedules) {
      bars.push({
        type: 'idle',
        startMs: toMs(idle.checkIn),
        endMs:   toMs(idle.checkOut),
        label:   idle.warehouseName,
        data:    idle,
      });
    }
    for (const mov of trip.movingTripSchedules) {
      bars.push({
        type: 'moving',
        startMs: toMs(mov.departure),
        endMs:   toMs(mov.arrival),
        label:   `${mov.originWarehouse} → ${mov.destinationWarehouse}`,
        data:    mov,
      });
    }
  }
  return bars.sort((a, b) => a.startMs - b.startMs);
}

function getLicensePlate(vs: VehicleSchedule): string {
  return vs.licensePlate || 'Unknown';
}

interface Overlap { startMs: number; endMs: number; }

function calculateOverlaps(bars: GanttBar[]): Overlap[] {
  const overlaps: Overlap[] = [];
  // Sort bars by start time to simplify overlap detection
  const sortedBars = [...bars].sort((a, b) => a.startMs - b.startMs);

  for (let i = 0; i < sortedBars.length; i++) {
    for (let j = i + 1; j < sortedBars.length; j++) {
      const barA = sortedBars[i];
      const barB = sortedBars[j];

      // Check for overlap
      if (barA.endMs > barB.startMs && barA.startMs < barB.endMs) {
        const overlapStart = Math.max(barA.startMs, barB.startMs);
        const overlapEnd   = Math.min(barA.endMs, barB.endMs);
        overlaps.push({ startMs: overlapStart, endMs: overlapEnd });
      }
    }
  }

  // Merge overlapping intervals (e.g., [1,5] and [3,7] becomes [1,7])
  if (overlaps.length === 0) return [];

  const mergedOverlaps: Overlap[] = [];
  let currentOverlap = { ...overlaps[0] };

  for (let i = 1; i < overlaps.length; i++) {
    const nextOverlap = overlaps[i];
    if (nextOverlap.startMs <= currentOverlap.endMs) {
      currentOverlap.endMs = Math.max(currentOverlap.endMs, nextOverlap.endMs);
    }
    else {
      mergedOverlaps.push(currentOverlap);
      currentOverlap = { ...nextOverlap };
    }
  }
  mergedOverlaps.push(currentOverlap);

  return mergedOverlaps;
}

function buildTimeTicks(startMs: number, endMs: number) {
  const INTERVAL = 6 * 3600 * 1000;
  const ticks: Array<{ ms: number; label: string; isDay: boolean }> = [];
  const tzOffset = 7 * 3600 * 1000;
  const snapped = Math.ceil((startMs + tzOffset) / INTERVAL) * INTERVAL - tzOffset;
  for (let ms = snapped; ms <= endMs; ms += INTERVAL) {
    const d = new Date(ms);
    const h = d.getHours();
    const isDay = h === 0;
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const label = isDay ? `${dd}/${mo}` : `${String(h).padStart(2,'0')}:00`;
    ticks.push({ ms, label, isDay });
  }
  return ticks;
}

// ─── Tooltip positioning (fixed to viewport) ─────────────────────────────────

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendItem({ color, borderColor, label }: { color: string; borderColor: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-4 h-3 rounded-sm" style={{ backgroundColor: color, border: `1px solid ${borderColor}` }} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GanttChart({ vehicles, pxPerMs }: GanttChartProps) {
  const scrollRef  = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = React.useState<GanttTipState | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // ── Global time range ──
  const { globalStart, globalEnd } = React.useMemo(() => {
    let min = Infinity, max = -Infinity;
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
    const tzOff = 7 * 3600 * 1000;
    const dayMs = 86400 * 1000;
    const startSnap = Math.floor((min + tzOff) / dayMs) * dayMs - tzOff;
    const endSnap   = Math.ceil((max + tzOff) / dayMs) * dayMs - tzOff;
    return { globalStart: startSnap, globalEnd: endSnap };
  }, [vehicles]);

  const totalMs = globalEnd - globalStart;
  const resolvedPxPerMs = pxPerMs ?? Math.max(120 / 86400000, 1 / 300000);
  const timelineWidth   = Math.max(800, totalMs * resolvedPxPerMs);

  const ticks = React.useMemo(() => buildTimeTicks(globalStart, globalEnd), [globalStart, globalEnd]);

  // ── Close tooltip on outside click ──
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

  return (
    <div className="relative select-none" style={{ fontFamily: 'inherit' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <span className="text-xs font-medium text-slate-500">Chú thích:</span>
        <LegendItem color={COLOR_MOVING} borderColor={COLOR_MOVING_BORDER} label="Di chuyển" />
        <LegendItem color={COLOR_IDLE}   borderColor={COLOR_IDLE_BORDER}   label="Dừng tại kho" />
      </div>

      {/* Scrollable chart */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        <div style={{ display: 'flex', minWidth: LABEL_WIDTH + timelineWidth }}>

          {/* Label column */}
          <div
            className="shrink-0 bg-slate-50 border-r border-slate-200 z-10"
            style={{ width: LABEL_WIDTH, position: 'sticky', left: 0 }}
          >
            <div style={{ height: HEADER_HEIGHT }} className="border-b border-slate-200 flex items-end pb-2 px-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Xe</span>
            </div>
            {vehicles.map((vs, i) => {
              const plate = getLicensePlate(vs);
              return (
                <div
                  key={plate + i}
                  style={{ height: ROW_HEIGHT }}
                  className={`flex items-center px-2 border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <span className="text-xs font-semibold text-slate-700 truncate" title={plate}>{plate}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, position: 'relative', minWidth: timelineWidth }}>
            {/* Header */}
            <div style={{ height: HEADER_HEIGHT, position: 'sticky', top: 0, zIndex: 5 }} className="bg-slate-50 border-b border-slate-200">
              {ticks.map((tick) => {
                const x = (tick.ms - globalStart) * resolvedPxPerMs;
                return (
                  <div key={tick.ms} style={{ position: 'absolute', left: x, top: 0, height: '100%' }}>
                    <div
                      style={{ position: 'absolute', bottom: 6, left: 4, whiteSpace: 'nowrap' }}
                      className={`text-[10px] font-${tick.isDay ? 'bold' : 'medium'} ${tick.isDay ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {tick.label}
                    </div>
                    <div
                      style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: tick.isDay ? 1.5 : 1,
                        height: tick.isDay ? 20 : 12,
                        background: tick.isDay ? '#64748b' : '#cbd5e1',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Vehicle rows */}
            {vehicles.map((vs, rowIdx) => {
              const bars = buildBars(vs);
              const overlaps = calculateOverlaps(bars);
              const plate = getLicensePlate(vs);
              return (
                <div
                  key={plate + rowIdx}
                  style={{ height: ROW_HEIGHT, position: 'relative', background: rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff' }}
                  className="border-b border-slate-100"
                >
                  {/* Day grid lines */}
                  {ticks.filter(t => t.isDay).map(tick => (
                    <div key={tick.ms} style={{ position: 'absolute', left: (tick.ms - globalStart) * resolvedPxPerMs, top: 0, width: 1, height: '100%', background: '#e2e8f0', pointerEvents: 'none' }} />
                  ))}
                  {/* 6h sub-grid */}
                  {ticks.filter(t => !t.isDay).map(tick => (
                    <div key={tick.ms} style={{ position: 'absolute', left: (tick.ms - globalStart) * resolvedPxPerMs, top: 0, width: 1, height: '100%', background: '#f1f5f9', pointerEvents: 'none' }} />
                  ))}

                  {/* Bars */}
                  {bars.map((bar, barIdx) => {
                    const left  = (bar.startMs - globalStart) * resolvedPxPerMs;
                    const width = Math.max(MIN_BAR_PX, (bar.endMs - bar.startMs) * resolvedPxPerMs);
                    const isIdle    = bar.type === 'idle';
                    const bgColor   = isIdle ? COLOR_IDLE   : COLOR_MOVING;
                    const borderCol = isIdle ? COLOR_IDLE_BORDER : COLOR_MOVING_BORDER;
                    const isActive  = tooltip?.data === bar.data;
                    const PAD = 4;

                    return (
                      <div
                        key={barIdx}
                        style={{
                          position: 'absolute', left, top: PAD,
                          width, height: ROW_HEIGHT - PAD * 2,
                          backgroundColor: bgColor,
                          border: `1px solid ${borderCol}`,
                          borderRadius: 7,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          opacity: isActive ? 1 : 0.88,
                          boxShadow: isActive
                            ? `0 0 0 2px ${borderCol}, 0 2px 8px rgba(0,0,0,0.15)`
                            : '0 1px 2px rgba(0,0,0,0.08)',
                          transition: 'opacity 0.15s, box-shadow 0.15s',
                          display: 'flex', alignItems: 'center',
                          zIndex: isActive ? 3 : 1,
                        }}
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip({
                            kind: bar.type,
                            data: bar.data,
                            vx: rect.left + rect.width / 2,
                            vy: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip(prev => prev?.data === bar.data ? null : {
                            kind: bar.type,
                            data: bar.data,
                            vx: rect.left + rect.width / 2,
                            vy: rect.top,
                          });
                        }}
                        role="button"
                        aria-label={`${isIdle ? 'Điểm dừng' : 'Di chuyển'}: ${bar.label}`}
                        tabIndex={0}
                      >
                        {width > 40 && (
                          <span style={{ fontSize: 10, color: '#FFFBB1', fontWeight: 600, paddingLeft: 4, paddingRight: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                            {bar.label}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Overlap overlays with red diagonal stripes */}
                  {overlaps.map((overlap, idx) => {
                    const left  = (overlap.startMs - globalStart) * resolvedPxPerMs;
                    const width = Math.max(MIN_BAR_PX, (overlap.endMs - overlap.startMs) * resolvedPxPerMs);
                    const PAD = 4;
                    return (
                      <div
                        key={`overlap-${idx}`}
                        style={{
                          position: 'absolute',
                          left,
                          top: PAD,
                          width,
                          height: ROW_HEIGHT - PAD * 2,
                          background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239, 68, 68, 0.4) 4px, rgba(239, 68, 68, 0.4) 8px)',
                          borderRadius: 7,
                          pointerEvents: 'none',
                          zIndex: 2,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip — rendered into a portal-like fixed layer */}
      {tooltip && (
        <GanttTooltipCard
          tip={tooltip}
        />
      )}
    </div>
  );
}

export default GanttChart;
