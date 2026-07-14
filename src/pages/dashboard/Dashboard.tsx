/**
 * Dashboard page — operational overview with KPIs and stats panels.
 * Date range is driven entirely by globalDateRange from Zustand uiStore.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/useDashboard';
import { useUIStore } from '@/store/uiStore';

import { KPISection } from './KPISection';
import { WarehouseStatsPanel } from './WarehouseStatsPanel';
import { TransportStatsPanel } from './TransportStatsPanel';
import { StatsCarousel } from '@/components/shared/StatsCarousel';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // Read date range entirely from global store
  const { globalDateRange } = useUIStore();

  // ── Data fetch ────────────────────────────────────────────────────────────
  // When globalDateRange changes, the query key changes and TanStack Query
  // automatically triggers a new fetch.
  const { data, isLoading, error, refetch } = useDashboard({
    startDate: globalDateRange.startDate,
    endDate: globalDateRange.endDate,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  /**
   * Manual refresh — re-fetches data for the current global date range.
   */
  function handleRefresh() {
    refetch();
  }

  // ── Stale-data flag — we have previous data but a new error arrived
  const isStale = error !== null && data !== null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Standalone Refresh button ────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh dashboard data"
          className="flex items-center gap-2 h-9 text-sm"
        >
          <RefreshCw size={14} aria-hidden="true" className={isLoading ? 'animate-spin' : ''} />
          Tải lại
        </Button>
      </div>

      {/* ── Error banner with stale-data indicator ─────────────── */}
      {error !== null && (
        <div
          role="alert"
          className="flex flex-wrap items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0 text-red-500"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-1">
            <p className="font-medium">Failed to load dashboard data.</p>
            {isStale && (
              <p className="text-red-600">
                The data displayed may be outdated (stale).
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── KPI section — loads independently ───────────────────────────── */}
      <KPISection data={data} isLoading={isLoading} />

      {/* ── Stats carousel — Warehouse & Transport panels ─────────────────── */}
      <StatsCarousel
        slides={[
          {
            title: 'Thống kê kho',
            content: <WarehouseStatsPanel data={data} isLoading={isLoading} />,
          },
          {
            title: 'Thống kê nhập/xuất',
            content: <TransportStatsPanel data={data} isLoading={isLoading} />,
          },
        ]}
      />
    </div>
  );
}
