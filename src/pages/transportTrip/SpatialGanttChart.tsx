/**
 * SpatialGanttChart — Biểu đồ Gantt không gian cho tuyến xe.
 * - Trục X: Kho theo vị trí địa lý (Văn Giang → Sóng Thần)
 * - Trục Y: Nhóm theo biển số xe; mỗi xe N hàng = N chuyến
 */
import * as React from 'react';
import type { VehicleSchedule, IdleTripSchedule, MovingTripSchedule, TripSchedule } from '@/types/schedule';
import {
  GanttTooltipCard,
  type GanttTipState,
} from '@/components/shared/GanttTooltip';

// ─── Warehouse list ───────────────────────────────────────────────────────────
export const WAREHOUSES = [
  'Văn Giang','Vinfast HY','Hải Phòng','Thanh Hóa','Nghệ An',
  'Q.Bình','Q.Trị','Huế','Đà Nẵng','Q.Ngãi',
  'Kon Tum','Gia Lai','B.Định','Phú Yên','B.M.T',
  'Diên Khánh','N.Thuận','B.Thuận','Sóng Thần',
];

const WAREHOUSE_ALIAS: Record<string, string> = {
  'Kho Văn Giang':'Văn Giang','Kho Vinfast HY':'Vinfast HY','Kho dự án Vinfast Hưng Yên':'Vinfast HY','Kho Hải Phòng':'Hải Phòng',
  'Kho Thanh Hóa':'Thanh Hóa','Kho Nghệ An':'Nghệ An','Kho Quảng Bình':'Q.Bình',
  'Kho Quảng Trị':'Q.Trị','Kho Huế':'Huế','Kho ĐB-Đà Nẵng':'Đà Nẵng',
  'Kho Đà Nẵng':'Đà Nẵng','Kho Quảng Ngãi':'Q.Ngãi','Kho Kon Tum':'Kon Tum',
  'Kho Gia Lai':'Gia Lai','Kho Hàng Gia Lai':'Gia Lai','Kho Bình Định':'B.Định','Kho Bộ Phú Yên':'Phú Yên',
  'Kho Phú Yên':'Phú Yên','Kho B.M.T':'B.M.T','Kho Buôn Ma Thuột':'B.M.T',
  'Kho hàng Buôn Ma Thuột':'B.M.T','Kho Diên Khánh':'Diên Khánh',
  'Kho Ninh Thuận':'N.Thuận','Kho Bình Thuận':'B.Thuận','Kho Sóng Thần':'Sóng Thần',
  'Kho Đắc Nông':'Đắc Nông','Kho Nam Định':'Nam Định','Kho Tam Kỳ':'Tam Kỳ',
  'Kho Từ Sơn - Bắc Ninh':'T.Sơn','Kho 18A Cộng Hòa':'18A C.Hòa',
  'Bưu cục Hà Nam':'BC Hà Nam','Kho hàng ICD Mỹ đình':'ICD Mỹ Đình',
};

function normalizeWh(name: string): string {
  if (!name) return '';
  return WAREHOUSE_ALIAS[name] ?? name.replace(/^Kho\s+/i, '').trim();
}
function whIndex(name: string): number {
  return WAREHOUSES.indexOf(normalizeWh(name));
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const COL_W  = 66;   // px per warehouse column
const ROW_H  = 26;   // px per trip row
const LEFT_W = 136;  // px left label panel
const HDR_H  = 48;   // px header height

const COLOR_S = '#458B73';
const COLOR_N = '#FF9760';
const COLOR_Y_FILL = '#FEF08A';
const COLOR_Y_STR  = '#EAB308';
const COLOR_R_STR  = '#EF4444';

// ─── Internal types ───────────────────────────────────────────────────────────
interface TripRow { tripId: string; idle: IdleTripSchedule[]; moving: MovingTripSchedule[]; }
interface VehicleGroup { licensePlate: string; vehicleType: string; trips: TripRow[]; }

type TipData = GanttTipState | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildGroups(vehicles: VehicleSchedule[]): VehicleGroup[] {
  return vehicles.map(v => ({
    licensePlate: v.licensePlate,
    vehicleType:  v.vehicleType,
    trips: v.trips.map((t: TripSchedule) => ({
      tripId:  t.id,
      idle:    t.idleTripSchedules,
      moving:  t.movingTripSchedules,
    })).sort((a, b) => {
      const ta = new Date(a.idle[0]?.checkIn ?? a.moving[0]?.departure ?? 0).getTime();
      const tb = new Date(b.idle[0]?.checkIn ?? b.moving[0]?.departure ?? 0).getTime();
      return ta - tb;
    }),
  })).filter(g => g.trips.length > 0);
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { vehicles: VehicleSchedule[]; }

export function SpatialGanttChart({ vehicles }: Props) {
  const groups      = React.useMemo(() => buildGroups(vehicles), [vehicles]);
  const bodyRef     = React.useRef<HTMLDivElement>(null);
  const hdrRef      = React.useRef<HTMLDivElement>(null);
  const [tip, setTip] = React.useState<TipData>(null);

  // row layout
  type RowItem =
    | { kind: 'vehicle'; group: VehicleGroup; rowIdx: number }
    | { kind: 'trip'; trip: TripRow; group: VehicleGroup; rowIdx: number; last: boolean };

  const { items, totalRows } = React.useMemo(() => {
    const items: RowItem[] = [];
    let idx = 0;
    for (const g of groups) {
      items.push({ kind: 'vehicle', group: g, rowIdx: idx++ });
      g.trips.forEach((t, i) => items.push({ kind: 'trip', trip: t, group: g, rowIdx: idx++, last: i === g.trips.length - 1 }));
    }
    return { items, totalRows: idx };
  }, [groups]);

  const SVG_W = WAREHOUSES.length * COL_W;
  const SVG_H = totalRows * ROW_H;

  const onBodyScroll = React.useCallback(() => {
    if (hdrRef.current && bodyRef.current) hdrRef.current.scrollLeft = bodyRef.current.scrollLeft;
  }, []);

  const rowY  = (i: number) => i * ROW_H + ROW_H / 2;
  const colX  = (i: number) => i * COL_W + COL_W / 2;

  return (
    <div className="relative w-full flex flex-col overflow-hidden" style={{ minHeight: 360 }}
      onMouseLeave={() => setTip(null)}>

      {/* Header */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0" style={{ height: HDR_H }}>
        <div className="shrink-0 border-r border-slate-200 bg-white flex items-end pb-1.5 px-2" style={{ width: LEFT_W }}>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Biển số / Mã chuyến</span>
        </div>
        <div ref={hdrRef} className="flex-1 overflow-hidden" style={{ height: HDR_H }}>
          <div className="flex h-full items-end" style={{ width: SVG_W }}>
            {WAREHOUSES.map(wh => {
              const isHighlighted = ['Văn Giang', 'Đà Nẵng', 'Sóng Thần'].includes(wh);
              return (
                <div key={wh} className="flex flex-col items-center justify-end pb-1 gap-0.5 shrink-0" style={{ width: COL_W }}>
                  <span className={`leading-tight text-center ${isHighlighted ? 'text-[11px] font-bold text-slate-900' : 'text-[9px] font-semibold text-slate-700'}`}>{wh}</span>
                  <div className={`w-px ${isHighlighted ? 'h-2 bg-slate-400' : 'h-1.5 bg-slate-300'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="shrink-0 border-r border-slate-200 bg-white overflow-y-hidden z-10" style={{ width: LEFT_W, height: SVG_H }}>
          {items.map(item => {
            if (item.kind === 'vehicle') return (
              <div key={`v-${item.group.licensePlate}`}
                className="flex items-center gap-1 px-2 bg-slate-50 border-b border-slate-200"
                style={{ height: ROW_H }}>
                <span className="font-bold text-[10px] text-slate-800 tracking-tight truncate">{item.group.licensePlate}</span>
                <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-px rounded font-bold uppercase shrink-0">
                  {item.group.vehicleType.replace(/[^\d]+(\d+).*/,'V$1').slice(0,3)}
                </span>
                <span className="text-[8px] text-slate-400 ml-auto shrink-0">{item.group.trips.length}</span>
              </div>
            );
            const label = item.trip.tripId.toString();
            return (
              <div key={`t-${item.trip.tripId}`}
                className="flex items-center pl-4 pr-2 border-b"
                style={{ height: ROW_H, borderColor: item.last ? '#d1d5db' : '#f3f4f6', borderBottomWidth: item.last ? 2 : 1 }}>
                <span className="text-[9px] text-slate-500 font-mono">{label}</span>
              </div>
            );
          })}
        </div>

        {/* SVG */}
        <div ref={bodyRef} className="flex-1 overflow-auto" style={{ height: SVG_H + 12 }} onScroll={onBodyScroll}>
          <svg width={SVG_W} height={SVG_H} className="block" onMouseLeave={() => setTip(null)}>
            <defs>
              <marker id="as" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill={COLOR_S} />
              </marker>
              <marker id="an" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill={COLOR_N} />
              </marker>
            </defs>

            {/* grid */}
            {WAREHOUSES.map((_,ci) => <line key={ci} x1={colX(ci)} y1={0} x2={colX(ci)} y2={SVG_H} stroke="#f1f5f9" strokeWidth={1} />)}
            {items.map(item => {
              const y = (item.rowIdx + 1) * ROW_H;
              const strong = item.kind === 'vehicle' || (item.kind === 'trip' && item.last);
              return <line key={item.rowIdx} x1={0} y1={y} x2={SVG_W} y2={y} stroke={strong ? '#d1d5db' : '#f3f4f6'} strokeWidth={strong ? 2 : 1} />;
            })}
            {items.filter(i => i.kind === 'vehicle').map(item => (
              <rect key={`bg-${item.group.licensePlate}`} x={0} y={item.rowIdx * ROW_H} width={SVG_W} height={ROW_H} fill="#f8fafc" />
            ))}

            {/* trip rows */}
            {items.map(item => {
              if (item.kind === 'vehicle') return null;
              const { trip, rowIdx } = item;
              const cy = rowY(rowIdx);
              
              // Collect all warehouse indices used by this trip
              const usedWarehouseIndices = new Set<number>();
              trip.moving.forEach(m => {
                const xi = whIndex(m.originWarehouse), xj = whIndex(m.destinationWarehouse);
                if (xi >= 0) usedWarehouseIndices.add(xi);
                if (xj >= 0) usedWarehouseIndices.add(xj);
              });
              trip.idle.forEach(idl => {
                const xi = whIndex(idl.warehouseName);
                if (xi >= 0) usedWarehouseIndices.add(xi);
              });
              
              return (
                <g key={`trip-${trip.tripId}`}>
                  {trip.moving.map((m, mi) => {
                    const xi = whIndex(m.originWarehouse), xj = whIndex(m.destinationWarehouse);
                    if (xi < 0 || xj < 0) return null;
                    const south = xi < xj;
                    const lineColor = south ? COLOR_S : COLOR_N;
                    // Find the idle record at the destination warehouse (for end-point tooltip)
                    const destIdleData = trip.idle.find(
                      idl => whIndex(idl.warehouseName) === xj
                    );
                    return (
                      <g key={mi}>
                        <line
                          x1={colX(xi)} y1={cy} x2={colX(xj)} y2={cy}
                          stroke={lineColor} strokeWidth={3}
                          markerEnd={south ? 'url(#as)' : 'url(#an)'}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => setTip({ kind: 'moving', data: m, vx: e.clientX, vy: e.clientY })}
                          onMouseLeave={() => setTip(null)}
                        />
                        {/* End-point circle at destination — interactive if idle data exists */}
                        <g
                          style={{ cursor: destIdleData ? 'pointer' : 'default' }}
                          onMouseEnter={destIdleData
                            ? (e) => setTip({ kind: 'idle', data: destIdleData, vx: e.clientX, vy: e.clientY })
                            : undefined}
                          onMouseLeave={destIdleData ? () => setTip(null) : undefined}
                        >
                          <circle cx={colX(xj)} cy={cy} r={5.5} fill={lineColor} />
                          <circle cx={colX(xj)} cy={cy} r={3}   fill="#fff" />
                          <circle cx={colX(xj)} cy={cy} r={1.5} fill={lineColor} />
                        </g>
                      </g>
                    );
                  })}
                  {trip.idle.map((idl, ii) => {
                    const xi = whIndex(idl.warehouseName);
                    if (xi < 0) return null;
                    const cx = colX(xi);
                    const isFirst = ii === 0, isLast = ii === trip.idle.length - 1;
                    const endpoint = isFirst || isLast;
                    const has = idl.totalUploadBill > 0 || idl.totalDownloadBill > 0;
                    let epColor = COLOR_S;
                    if (trip.idle.length >= 2) {
                      const i0 = whIndex(trip.idle[0].warehouseName);
                      const iN = whIndex(trip.idle[trip.idle.length - 1].warehouseName);
                      epColor = i0 <= iN ? COLOR_S : COLOR_N;
                    }
                    // Only draw idle circles if this warehouse is NOT an endpoint of a moving segment
                    // to avoid overlapping with arrow markers (except for start point which should always be visible)
                    const isMovingEndpoint = trip.moving.some(m => {
                      const oi = whIndex(m.originWarehouse), di = whIndex(m.destinationWarehouse);
                      return oi === xi || di === xi;
                    });
                    // Skip if endpoint AND moving endpoint, BUT always draw the first point (start)
                    if (endpoint && isMovingEndpoint && !isFirst) return null;
                    return (
                      <g key={ii} style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => setTip({ kind: 'idle', data: idl, vx: e.clientX, vy: e.clientY })}
                        onMouseLeave={() => setTip(null)}>
                        {isFirst ? (
                          // Start point: distinctive style with dot inside
                          <>
                            <circle cx={cx} cy={cy} r={6} fill={epColor} />
                            <circle cx={cx} cy={cy} r={3.5} fill="#fff" />
                            <circle cx={cx} cy={cy} r={1.8} fill={epColor} />
                          </>
                        ) : endpoint ? (
                          // Other endpoints (end point): standard endpoint style
                          <>
                            <circle cx={cx} cy={cy} r={5.5} fill={epColor} />
                            <circle cx={cx} cy={cy} r={3}   fill="#fff" />
                            <circle cx={cx} cy={cy} r={1.5} fill={epColor} />
                          </>
                        ) : (
                          // Intermediate idle points
                          <circle cx={cx} cy={cy} r={4}
                            fill={has ? COLOR_Y_FILL : '#fff'}
                            stroke={has ? COLOR_Y_STR : COLOR_R_STR}
                            strokeWidth={1.8} />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {tip && (
          <GanttTooltipCard tip={tip} />
        )}
      </div>
    </div>
  );
}
