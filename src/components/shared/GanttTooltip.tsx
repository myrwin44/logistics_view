/**
 * GanttTooltip — Shared tooltip cards for Gantt / Spatial charts.
 * Used by both GanttChart (timeline) and SpatialGanttChart (spatial).
 */
import * as React from 'react';
import {
  Truck, Warehouse, ArrowRight, Clock,
  Upload, Download, Package, Weight, MapPin,
} from 'lucide-react';
import { formatWeight } from '@/lib/format';
import type { IdleTripSchedule, MovingTripSchedule } from '@/types/schedule';

// ─── Constants ────────────────────────────────────────────────────────────────
export const TOOLTIP_W   = 296;
const TOOLTIP_GAP        = 10;
const COLOR_IDLE         = '#283F24';
const COLOR_MOVING       = '#FFBF00';
const COLOR_IDLE_BORDER  = '#A5C89E';
const COLOR_MOVING_BORDER = '#D4A017';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function fmtMinutes(totalMin: number) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}ph`;
}
function fmtNum(n: number) { return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 }); }
export function shortWh(name: string) { return name.replace(/^Kho\s+/i, '').trim(); }

// ─── Moving card ─────────────────────────────────────────────────────────────
export function MovingCard({ data }: { data: MovingTripSchedule }) {
  const origin     = shortWh(data.originWarehouse);
  const dest       = shortWh(data.destinationWarehouse);
  const sameDayDep = fmtDate(data.departure) === fmtDate(data.arrival);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: COLOR_MOVING, border: `1px solid ${COLOR_MOVING_BORDER}` }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Di chuyển</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
          {fmtMinutes(data.totalTime)}
        </span>
      </div>

      {/* Flight-board row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-[#283F24] leading-snug break-words">{origin}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(data.departure)}</p>
          <p className="text-[14px] font-bold text-slate-700 tabular-nums mt-0.5">{fmtTime(data.departure)}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
          <Truck size={15} className="text-[#FFBF00]" />
          <div className="flex items-center gap-0.5">
            <div className="w-5 border-t border-dashed border-slate-300" />
            <ArrowRight size={10} className="text-slate-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[13px] font-black text-[#1565C0] leading-snug break-words">{dest}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{sameDayDep ? '' : fmtDate(data.arrival)}</p>
          <p className="text-[14px] font-bold text-slate-700 tabular-nums mt-0.5">{fmtTime(data.arrival)}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2 flex items-center gap-3">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Package size={11} className="text-slate-400" />
          <span>{fmtNum(data.totalBill)} bill</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Weight size={11} className="text-slate-400" />
          <span>{formatWeight(data.totalLoad)}</span>
        </div>
        {data.distance > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-auto">
            <MapPin size={11} className="text-slate-400" />
            <span>{fmtNum(data.distance)} km</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Idle card ────────────────────────────────────────────────────────────────
export function IdleCard({ data }: { data: IdleTripSchedule }) {
  const wh = shortWh(data.warehouseName);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: COLOR_IDLE, border: `1px solid ${COLOR_IDLE_BORDER}` }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dừng tại kho</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Clock size={9} />
          {fmtMinutes(data.totalTime)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#EDF5EA' }}>
          <Warehouse size={16} style={{ color: COLOR_IDLE }} />
        </div>
        <p className="text-[18px] font-black text-[#283F24] leading-tight">{wh}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 rounded-lg px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-slate-400 mb-0.5">Vào kho</p>
          <p className="text-[13px] font-bold text-slate-700 tabular-nums">{fmtTime(data.checkIn)}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(data.checkIn)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-slate-400 mb-0.5">Ra kho</p>
          <p className="text-[13px] font-bold text-slate-700 tabular-nums">{fmtTime(data.checkOut)}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(data.checkOut)}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mb-1">
            <Upload size={10} /><span>Nhập</span>
          </div>
          <p className="text-[11px] text-slate-600">
            <span className="font-semibold">{fmtNum(data.totalUploadBill)}</span>
            <span className="text-slate-400"> bill</span>
          </p>
          <p className="text-[11px] text-slate-600">{formatWeight(data.totalUploadWeight)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold mb-1">
            <Download size={10} /><span>Xuất</span>
          </div>
          <p className="text-[11px] text-slate-600">
            <span className="font-semibold">{fmtNum(data.totalDownloadBill)}</span>
            <span className="text-slate-400"> bill</span>
          </p>
          <p className="text-[11px] text-slate-600">{formatWeight(data.totalDownloadWeight)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Positioned tooltip wrapper (fixed to viewport) ──────────────────────────

export interface GanttTipState {
  kind: 'idle' | 'moving';
  data: IdleTripSchedule | MovingTripSchedule;
  /** viewport x of anchor point */
  vx: number;
  /** viewport y of anchor point */
  vy: number;
}

export function GanttTooltipCard({
  tip,
  onClose,
}: {
  tip: GanttTipState;
  onClose: () => void;
}) {
  const ref  = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);

  React.useLayoutEffect(() => {
    const h  = ref.current?.offsetHeight ?? 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = tip.vx - TOOLTIP_W / 2;
    if (left + TOOLTIP_W > vw - 8) left = vw - TOOLTIP_W - 8;
    if (left < 8) left = 8;

    let top = tip.vy - h - TOOLTIP_GAP;
    if (top < 8) top = tip.vy + TOOLTIP_GAP;
    if (top + h > vh - 8) top = vh - h - 8;

    setPos({ left, top });
  }, [tip.vx, tip.vy]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left:  pos?.left ?? -9999,
        top:   pos?.top  ?? -9999,
        width: TOOLTIP_W,
        zIndex: 9999,
        pointerEvents: 'auto',
        opacity: pos ? 1 : 0,
        transition: 'opacity 0.12s ease-out',
      }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-300 hover:text-slate-600 transition-colors rounded-full w-5 h-5 flex items-center justify-center text-base leading-none"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="Đóng"
      >×</button>

      {tip.kind === 'idle'
        ? <IdleCard   data={tip.data as IdleTripSchedule} />
        : <MovingCard data={tip.data as MovingTripSchedule} />}
    </div>
  );
}
