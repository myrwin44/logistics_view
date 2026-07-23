/**
 * ServiceWeightTreemap — Treemap with drilldown showing service weight distribution.
 * Root level: each service tile sized by totalWeight.
 * Drilldown: warehouses within a service, sized by totalWeight per warehouse.
 */

import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

import { SkeletonChart } from '@/components/shared/SkeletonChart';
import { formatWeight } from '@/lib/format';
import type { BillStatItem } from '@/types/dashboard';

// ─── Colour palettes ──────────────────────────────────────────────────────────

/** Root-level colours — one per service tile */
const ROOT_COLORS = [
  '#467235', // brand green
  '#FFBF00', // amber
  '#1565C0', // blue
  '#C62828', // red
  '#6A1B9A', // purple
  '#00695C', // teal
  '#EF6C00', // orange
  '#37474F', // blue-grey
  '#558B2F', // light-green
];

/** Drilldown palette — shades used for warehouse tiles */
const DRILL_PALETTES: Record<string, string[]> = {
  '0': ['#2E7D32', '#388E3C', '#4CAF50', '#81C784', '#C8E6C9'],
  '1': ['#F57F17', '#F9A825', '#FBC02D', '#FFCA28', '#FFE082'],
  '2': ['#0D47A1', '#1565C0', '#1976D2', '#42A5F5', '#90CAF9'],
  '3': ['#B71C1C', '#C62828', '#D32F2F', '#E57373', '#FFCDD2'],
  '4': ['#4A148C', '#6A1B9A', '#8E24AA', '#CE93D8', '#E1BEE7'],
  '5': ['#004D40', '#00695C', '#00897B', '#4DB6AC', '#B2DFDB'],
  '6': ['#BF360C', '#D84315', '#E64A19', '#FF7043', '#FFCCBC'],
  '7': ['#263238', '#37474F', '#546E7A', '#90A4AE', '#CFD8DC'],
  '8': ['#33691E', '#558B2F', '#7CB342', '#AED581', '#DCEDC8'],
};

const distributed = {
  treemap: { distributed: true, enableShades: false },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ServiceWeightTreemapProps {
  data: BillStatItem[] | null | undefined;
  isLoading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Filter out services with zero weight and sort descending */
function buildSeries(items: BillStatItem[]) {
  const active = items.filter((s) => s.totalWeight > 0);

  const rootData = active.map((s) => ({
    x: s.service,
    y: Math.round(s.totalWeight * 100) / 100,
    drilldown: s.service,
  }));

  const drilldownSeries = active.map((s, idx) => ({
    id: s.service,
    name: s.service,
    colors: DRILL_PALETTES[String(idx % Object.keys(DRILL_PALETTES).length)],
    plotOptions: distributed,
    data: s.warehouseStats
      .filter((w) => w.totalWeight > 0)
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .map((w) => ({
        x: w.warehouse,
        y: Math.round(w.totalWeight * 100) / 100,
      })),
  }));

  return { rootData, drilldownSeries };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ServiceWeightTreemap({ data, isLoading }: ServiceWeightTreemapProps) {
  if (isLoading) {
    return <SkeletonChart height={420} />;
  }

  const items = data ?? [];
  const active = items.filter((s) => s.totalWeight > 0);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">Không có dữ liệu tỉ trọng dịch vụ cho kì này</p>
      </div>
    );
  }

  const { rootData, drilldownSeries } = buildSeries(items);

  // @ts-ignore
  const options: ApexOptions = {
    chart: {
      type: 'treemap',
      height: 420,
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { enabled: true, speed: 300 },
    },
    legend: { show: false },
    colors: ROOT_COLORS,
    plotOptions: distributed,
    dataLabels: {
      enabled: true,
      style: { fontSize: '13px', fontWeight: '600' },
      formatter: (text: string) => text,
      offsetY: 0,
      textAnchor: 'middle',
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatWeight(val),
      },
    },
    drilldown: {
      enabled: true,
      breadcrumb: {
        show: true,
        position: 'top-right',
        rootLabel: 'Tất cả dịch vụ',
        separator: ' › ',
      },
      series: drilldownSeries,
    },
  };

  const series = [{ data: rootData }];

  return (
    <div>
      <ReactApexChart
        // force re-mount when data changes so drilldown state resets
        key={JSON.stringify(rootData.map((d) => d.y))}
        options={options}
        series={series}
        type="treemap"
        height={420}
      />
    </div>
  );
}

export default ServiceWeightTreemap;
