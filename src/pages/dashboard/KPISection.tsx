import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Truck, Car, Package, Weight } from 'lucide-react';

import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { formatWeight } from '@/lib/format';
import type { DashboardData } from '@/types/dashboard';

// ─── Shared palette ───────────────────────────────────────────────────────────

const GREEN  = '#283F24';
const YELLOW = '#FFBF00';
const MUTED  = '#E5E7EB';

// ─── Donut chart ──────────────────────────────────────────────────────────────

interface DonutProps {
  /** [company, rented] */
  series: [number, number];
  labels: [string, string];
}

function DonutChart({ series, labels }: DonutProps) {
  const total = series[0] + series[1];
  const safeSeries: number[] = total === 0 ? [1] : [...series];
  const safeColors = total === 0 ? [MUTED] : [GREEN, YELLOW];
  const safeLabels = total === 0 ? ['Chưa có dữ liệu'] : [...labels];

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 400 },
      // Give extra room so the selected-slice expansion never clips
      offsetX: 0,
      offsetY: 0,
    },
    colors: safeColors,
    labels: safeLabels,
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '64%',
          labels: { show: false },
        },
      },
    },
    tooltip: {
      enabled: total > 0,
      y: { formatter: (v: number) => v.toLocaleString('vi-VN') },
    },
  };

  return (
    // overflow:visible + padding lets the expand animation breathe without being clipped
    <div style={{ overflow: 'visible' }}>
      <ReactApexChart
        options={options}
        series={safeSeries}
        type="donut"
        width={88}
        height={88}
      />
    </div>
  );
}

// ─── Card with donut ──────────────────────────────────────────────────────────

interface DonutCardProps {
  icon: React.ReactNode;
  label: string;
  total: number;
  companyValue: number;
  rentedValue: number;
  companyLabel?: string;
  rentedLabel?: string;
  isLoading: boolean;
}

function KPICardWithDonut({
  icon, label, total, companyValue, rentedValue,
  companyLabel = 'Xe công ty',
  rentedLabel  = 'Xe thuê ngoài',
  isLoading,
}: DonutCardProps) {
  if (isLoading) {
    return <div className="rounded-lg border border-border bg-white"><SkeletonCard /></div>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="text-[#FFBF00]">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      </div>

      {/* Main content: total + donut */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: total number */}
        <span className="text-3xl font-semibold tabular-nums leading-none text-gray-900">
          {total.toLocaleString('vi-VN')}
        </span>

          {/* Right: donut — overflow:visible so the expand-on-click animation is not clipped */}
        <div style={{ overflow: 'visible', padding: '8px', margin: '-8px' }}>
          <DonutChart
            series={[companyValue, rentedValue]}
            labels={[companyLabel, rentedLabel]}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Simple KPI card (Bills + Tải) ────────────────────────────────────────────

interface SimpleCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subItems?: { label: string; value: number | string }[];
  isLoading: boolean;
}

function KPICardSimple({ icon, label, value, subItems, isLoading }: SimpleCardProps) {
  if (isLoading) {
    return <div className="rounded-lg border border-border bg-white"><SkeletonCard /></div>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="text-[#FFBF00]">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      </div>

      {/* Value */}
      <span className="text-3xl font-semibold tabular-nums leading-none text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </span>

      {/* Sub items */}
      {subItems && subItems.length > 0 && (
        <dl className="space-y-1 border-t border-[#F3F4F6] pt-2">
          {subItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <dt className="text-xs text-[#9CA3AF] truncate">{item.label}</dt>
              <dd className="text-xs font-medium tabular-nums text-[#374151] flex-shrink-0">
                {typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface KPISectionProps {
  data: DashboardData | null;
  isLoading: boolean;
}

export function KPISection({ data, isLoading }: KPISectionProps) {
  const trips    = data?.common.totalTrips;
  const vehicles = data?.common.totalVehicles;
  const bills    = data?.common.totalBills;

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* 1 — Tổng chuyến xe */}
      <KPICardWithDonut
        icon={<Truck size={14} />}
        label="Tổng chuyến xe"
        total={trips?.totalTrips ?? 0}
        companyValue={trips?.companyTrips ?? 0}
        rentedValue={trips?.rentedTrips ?? 0}
        companyLabel="Xe công ty"
        rentedLabel="Xe thuê ngoài"
        isLoading={isLoading}
      />

      {/* 2 — Số xe */}
      <KPICardWithDonut
        icon={<Car size={14} />}
        label="Số xe (biển số)"
        total={vehicles?.totalVehicles ?? 0}
        companyValue={vehicles?.companyVehicles ?? 0}
        rentedValue={vehicles?.rentedVehicles ?? 0}
        companyLabel="Xe công ty"
        rentedLabel="Xe thuê ngoài"
        isLoading={isLoading}
      />

      {/* 3 — Tổng bills */}
      <KPICardSimple
        icon={<Package size={14} />}
        label="Tổng bills hàng"
        value={bills?.totalBills ?? 0}
        subItems={[
          { label: 'Số mã chuyến', value: bills?.noTrips ?? 0 },
        ]}
        isLoading={isLoading}
      />

      {/* 4 — Tổng tải */}
      <KPICardSimple
        icon={<Weight size={14} />}
        label="Tổng tải"
        value={data ? formatWeight(data.common.totalLoads) : '—'}
        isLoading={isLoading}
      />
    </div>
  );
}
