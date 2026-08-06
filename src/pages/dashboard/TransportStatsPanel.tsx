import { Package } from 'lucide-react';
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
import { formatWeight, formatWeightCompact } from '@/lib/format';
import type { DashboardData } from '@/types/dashboard';

const COLOR_PRIMARY = '#467235';
const COLOR_SECONDARY = '#FFBF00';

interface LoadStatsPanelProps {
  data: DashboardData | null;
  isLoading: boolean;
}

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
          {entry.name}: {formatWeight(entry.value)}
        </p>
      ))}
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full py-10 text-center">
      <Package
        size={40}
        className="text-[#9CA3AF] opacity-60"
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-[#374151]">
        {message}
      </h3>
    </div>
  );
}

export function TransportStatsPanel({ data, isLoading }: LoadStatsPanelProps) {
  if (isLoading) {
    return (
      <div aria-label="Load Statistics" className="space-y-4">
        <SkeletonChart height={300} />
        <SkeletonChart height={300} />
      </div>
    );
  }

  const inLoads = data?.loads?.inLoads ?? [];
  const outLoads = data?.loads?.outLoads ?? [];

  const inLoadsEmpty = inLoads.length === 0;
  const outLoadsEmpty = outLoads.length === 0;

  const inChartData = inLoads.map(d => ({
    name: d.warehouseName,
    Vào: d.totalInLoad ?? 0,
  }));

  const outChartData = outLoads.map(d => ({
    name: d.warehouseName,
    Ra: d.totalOutLoad ?? 0,
  }));

  return (
    <section aria-label="Load Statistics">
      <div className="grid grid-cols-2 gap-4">
        {/* Top In-Loads */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#374151] mb-3">Top khối lượng nhập vào</h3>
          {inLoadsEmpty ? (
            <div style={{ height: 300 }}>
              <EmptyChartState message="Không có dữ liệu nhập vào cho kì này" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatWeightCompact(v)} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,191,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="square" />
                <Bar dataKey="Vào" fill={COLOR_PRIMARY} radius={[0, 5, 5, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Out-Loads */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <h3 className="text-sm font-semibold text-[#374151] mb-3">Top khối lượng xuất ra</h3>
          {outLoadsEmpty ? (
            <div style={{ height: 300 }}>
              <EmptyChartState message="Không có dữ liệu xuất ra cho kì này" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatWeightCompact(v)} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,191,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="square" />
                <Bar dataKey="Ra" fill={COLOR_SECONDARY} radius={[0, 5, 5, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

export default TransportStatsPanel;


