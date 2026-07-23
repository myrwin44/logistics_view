import { Building2, ArrowDownToLine, ArrowUpFromLine, Package } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import { SkeletonChart } from '@/components/shared/SkeletonChart';
import { formatWeight, formatWeightCompact } from '@/lib/format';
import type { DashboardData, WarehouseStats } from '@/types/dashboard';

// ─── Color palette ────────────────────────────────────────────────────────────
const COLOR_IN = '#467235';   // dark green — nhập kho
const COLOR_OUT = '#FFBF00';  // amber — xuất kho

// ─── Props ────────────────────────────────────────────────────────────────────
interface WarehouseStatsPanelProps {
  data: DashboardData | null;
  isLoading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByTotalVolume(stats: WarehouseStats[]): WarehouseStats[] {
  return [...stats].sort((a, b) => b.totalLoads - a.totalLoads);
}

function formatKgFull(value: number): string {
  return formatWeight(value);
}

function formatKgAxis(value: number): string {
  return formatWeightCompact(value);
}

// ─── Accessible data table ────────────────────────────────────────────────────

function AccessibleDataTable({ rows }: { rows: WarehouseStats[] }) {
  return (
    <table className="sr-only">
      <caption>Khối lượng nhập/xuất của kho</caption>
      <thead>
        <tr>
          <th scope="col">Kho</th>
          <th scope="col">KL nhập (kg)</th>
          <th scope="col">Bills nhập</th>
          <th scope="col">KL xuất (kg)</th>
          <th scope="col">Bills xuất</th>
          <th scope="col">Tổng KL (kg)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.warehouseName}>
            <td>{row.warehouseName}</td>
            <td>{row.totalInLoad}</td>
            <td>{row.totalInBills}</td>
            <td>{row.totalOutLoad}</td>
            <td>{row.totalOutBills}</td>
            <td>{row.totalLoads}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Building2 size={40} className="text-[#9CA3AF] opacity-60" aria-hidden="true" />
      <h3 className="text-base font-semibold text-[#374151]">
        Không có dữ liệu kho cho kì này.
      </h3>
      <p className="text-sm text-[#6B7280] max-w-xs">
        Thử thay đổi kì thời gian đã chọn.
      </p>
    </div>
  );
}

// ─── Butterfly chart (ApexCharts) ─────────────────────────────────────────────

interface ButterflyChartProps {
  ranked: WarehouseStats[];
}

function ButterflyChart({ ranked }: ButterflyChartProps) {
  // Show top 15 to keep chart readable
  const top15 = ranked.slice(0, 15);

  const categories = top15.map((w) => w.warehouseName);

  // ApexCharts diverging pattern:
  // "Vào" series → negative values (extends left)
  // "Ra"  series → positive values (extends right)
  const series: ApexOptions['series'] = [
    {
      name: 'Vào',
      data: top15.map((w) => -w.totalInLoad),
    },
    {
      name: 'Ra',
      data: top15.map((w) => w.totalOutLoad),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
        animateGradually: {
          enabled: true,
          delay: 80,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 450,
        },
      },
    },

    colors: [COLOR_IN, COLOR_OUT],

    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },

    dataLabels: {
      enabled: false,
    },

    stroke: {
      width: 0,
    },

    grid: {
      borderColor: '#F3F4F6',
      xaxis: {
        lines: { show: true },
      },
      yaxis: {
        lines: { show: false },
      },
    },

    xaxis: {
      categories,
      labels: {
        formatter: (val: string) => formatKgAxis(Number(val)),
        style: { fontSize: '10px', colors: '#9CA3AF' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        // Render "Vào" and "Ra" sub-labels via custom annotation instead
        text: undefined,
      },
    },

    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: '#374151' },
        maxWidth: 140,
      },
    },

    tooltip: {
      shared: false,
      y: {
        formatter: (val: number) => formatKgFull(Math.abs(val)),
      },
    },

    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontFamily: 'inherit',
      markers: {
        shape: 'square' as 'square',
        size: 8,
      },
      itemMargin: { horizontal: 12 },
      // Shift right by half of YAxis width (140px) so legend centres over the plot area
      offsetX: 70,
    },

    // "Vào" / "Ra" annotation below x-axis
    annotations: {
      xaxis: [
        {
          x: 0,
          borderColor: '#D1D5DB',
          borderWidth: 1,
          strokeDashArray: 0,
        },
      ],
    },
  };

  // Dynamic height: ~34px per row + top/bottom margin
  const chartHeight = Math.max(280, top15.length * 34 + 80);

  return (
    <div aria-hidden="true">
      <ReactApexChart
        type="bar"
        series={series}
        options={options}
        height={chartHeight}
      />
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
      className="grid grid-cols-2 gap-2"
      aria-label="Xếp hạng kho theo tổng khối lượng"
    >
      {ranked.map((wh, index) => {
        // Badge colour: green if inbound >= outbound, amber otherwise
        const badgeColor = wh.totalInLoad >= wh.totalOutLoad ? COLOR_IN : COLOR_OUT;

        return (
          <li
            key={wh.warehouseName}
            className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
          >
            {/* Top row: rank + name + total */}
            <div className="flex items-center gap-2">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ backgroundColor: badgeColor }}
                aria-label={`Hạng ${index + 1}`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-xs font-medium text-[#111827] truncate">
                {wh.warehouseName}
              </span>
              <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-[#374151]">
                {formatKgFull(wh.totalLoads)}
              </span>
            </div>

            {/* Sub rows */}
            <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 pl-7">
              <div className="flex items-center gap-1">
                <ArrowDownToLine size={10} className="flex-shrink-0" style={{ color: COLOR_IN }} aria-hidden="true" />
                <dt className="text-[10px] text-[#6B7280]">Nhập:</dt>
                <dd className="text-[10px] tabular-nums font-medium text-[#374151] truncate">
                  {formatKgFull(wh.totalInLoad)}
                </dd>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpFromLine size={10} className="flex-shrink-0" style={{ color: COLOR_OUT }} aria-hidden="true" />
                <dt className="text-[10px] text-[#6B7280]">Xuất:</dt>
                <dd className="text-[10px] tabular-nums font-medium text-[#374151] truncate">
                  {formatKgFull(wh.totalOutLoad)}
                </dd>
              </div>
              <div className="flex items-center gap-1">
                <Package size={10} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
                <dt className="text-[10px] text-[#6B7280]">B.nhập:</dt>
                <dd className="text-[10px] tabular-nums font-medium text-[#374151]">
                  {wh.totalInBills.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center gap-1">
                <Package size={10} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
                <dt className="text-[10px] text-[#6B7280]">B.xuất:</dt>
                <dd className="text-[10px] tabular-nums font-medium text-[#374151]">
                  {wh.totalOutBills.toLocaleString()}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WarehouseStatsPanel({ data, isLoading }: WarehouseStatsPanelProps) {
  if (isLoading) {
    return (
      <div aria-label="Warehouse Statistics" className="space-y-4">
        <SkeletonChart height={400} />
      </div>
    );
  }

  const warehouseStats = data?.warehouses ?? [];
  const ranked = sortByTotalVolume(warehouseStats);
  const isEmpty = ranked.length === 0;

  return (
    <section aria-label="Warehouse Statistics" className="space-y-4">

      {/* ── Butterfly bar chart ─────────────────────────────────────────────── */}
      <div
        className="rounded-lg border border-[#E5E7EB] bg-white p-4"
        role="img"
        aria-label="Biểu đồ nhập/xuất khối lượng theo kho"
      >
        {isEmpty ? (
          <EmptyChartState />
        ) : (
          <>
            <ButterflyChart ranked={ranked} />
            <AccessibleDataTable rows={ranked} />
          </>
        )}
      </div>

      {/* ── Rankings list ────────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#374151]">
            Xếp hạng - Tổng khối lượng
            <span className="ml-2 text-xs font-normal text-[#9CA3AF]">
              ({ranked.length} kho)
            </span>
          </h3>
          <RankingsList ranked={ranked} />
        </div>
      )}
    </section>
  );
}

export default WarehouseStatsPanel;
