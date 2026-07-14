import { Building2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { SkeletonChart } from '@/components/shared/SkeletonChart';
import type { DashboardData, WarehouseStats } from '@/types/dashboard';

// ─── Color palette ────────────────────────────────────────────────────────────
const COLOR_PRIMARY = '#467235';
const COLOR_SECONDARY = '#FFBF00';

// ─── Props ────────────────────────────────────────────────────────────────────
interface WarehouseStatsPanelProps {
  data: DashboardData | null;
  isLoading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sort warehouse stats by totalVolumeKg descending for the rankings list
 * and chart data.
 */
function sortByTotalVolume(stats: WarehouseStats[]): WarehouseStats[] {
  return [...stats].sort((a, b) => b.totalLoads - a.totalLoads);
}

function formatKg(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M kg`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K kg`;
  return `${value} kg`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm text-sm">
      <p className="font-medium text-[#111827] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatKg(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ─── sr-only data table ───────────────────────────────────────────────────────

function AccessibleDataTable({ rows }: { rows: WarehouseStats[] }) {
  return (
    <table className="sr-only">
      <caption>Khối lượng nhập/xuất của kho</caption>
      <thead>
        <tr>
          <th scope="col">Kho</th>
          <th scope="col">Khối lượng nhập (kg)</th>
          <th scope="col">Khối lượng xuất (kg)</th>
          <th scope="col">Tổng khối lượng nhập/xuất (kg)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.warehouseName}>
            <td>{row.warehouseName}</td>
            <td>{row.totalInLoad}</td>
            <td>{row.totalOutLoad}</td>
            <td>{row.totalLoads}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Empty chart state ────────────────────────────────────────────────────────

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full py-10 text-center">
      <Building2
        size={40}
        className="text-[#9CA3AF] opacity-60"
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-[#374151]">
        Không có dữ liệu kho cho kì này.
      </h3>
      <p className="text-sm text-[#6B7280] max-w-xs">
        Không có thống kê về khối lượng nhập/xuất cho các kho trong kì này. Thử thay đổi kì đã chọn.
      </p>
    </div>
  );
}

// ─── Rankings list ────────────────────────────────────────────────────────────

interface RankingsListProps {
  ranked: WarehouseStats[];
}

function RankingsList({ ranked }: RankingsListProps) {
  if (ranked.length === 0) return null;

  return (
    <ol
      className="space-y-2"
      aria-label="Warehouse rankings by total volume"
    >
      {ranked.map((wh, index) => (
        <li
          key={wh.warehouseName}
          className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
        >
          {/* Rank badge */}
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: wh.totalInLoad >= wh.totalOutLoad ? COLOR_PRIMARY : COLOR_SECONDARY }}
            aria-label={`Rank ${index + 1}`}
          >
            {index + 1}
          </span>

          {/* Warehouse name */}
          <span className="flex-1 text-sm font-medium text-[#111827] truncate">
            {wh.warehouseName}
          </span>

          {/* Total volume */}
          <span className="flex-shrink-0 text-sm font-mono tabular-nums text-[#374151]">
            {formatKg(wh.totalLoads)}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WarehouseStatsPanel({ data, isLoading }: WarehouseStatsPanelProps) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div aria-label="Warehouse Statistics" className="space-y-4">
        <SkeletonChart height={300} />
      </div>
    );
  }

  const warehouseStats = data?.warehouses ?? [];
  const ranked = sortByTotalVolume(warehouseStats);
  const isEmpty = ranked.length === 0;

  // Chart data — each bar group is one warehouse
  const chartData = ranked.map((wh) => ({
    name: wh.warehouseName,
    Vào: wh.totalInLoad,
    Ra: wh.totalOutLoad,
  }));

  return (
    <section aria-label="Warehouse Statistics" className="space-y-4">

      {/* ── Bar chart ──────────────────────────────────────────────────────── */}
      <div
        role="img"
        aria-label="Bar chart showing inbound and outbound volume per warehouse"
        className="rounded-lg border border-[#E5E7EB] bg-white p-4"
      >
        {isEmpty ? (
          <div style={{ height: 300 }}>
            <EmptyChartState />
          </div>
        ) : (
          <>
            {/* Dùng padding-bottom để tạo không gian cho XAxis labels xoay 45°
                thay vì dùng height cố định gây khoảng trắng thừa */}
            <div style={{ width: '100%' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 16, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#6B7280', textAnchor: 'end' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    interval={0}
                    angle={-40}
                    height={100}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatKg(v)}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: 'KL (kg)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 8,
                      fontSize: 10,
                      fill: '#9CA3AF',
                      dy: 30,
                    }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,191,0,0.08)' }} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: 12, paddingBottom: 4 }}
                    iconType="square"
                  />
                  <Bar dataKey="Vào" fill={COLOR_PRIMARY} radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Ra" fill={COLOR_SECONDARY} radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* sr-only accessible data table */}
            <AccessibleDataTable rows={ranked} />
          </>
        )}
      </div>

      {/* ── Rankings list ───────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#374151]">
            Xếp hạng - Tổng khối lượng
          </h3>
          <RankingsList ranked={ranked} />
        </div>
      )}
    </section>
  );
}

export default WarehouseStatsPanel;
