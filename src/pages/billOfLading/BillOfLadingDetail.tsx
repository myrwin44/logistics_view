import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Weight,
  ArrowLeft,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useBillDetail } from '@/hooks/useBillDetail';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/contexts/SettingsContext';
import { formatDate } from '@/lib/dateFormat';
import { formatWeight } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BillTrackLog } from '@/types/billOfLading';

// ---------------------------------------------------------------------------
// Skeleton sub-components
// ---------------------------------------------------------------------------

function SkeletonBillHeader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading bill details">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-6 space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-[#E5E7EB] p-4 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Track log card
// ---------------------------------------------------------------------------

interface TrackLogCardProps {
  log: BillTrackLog;
  index: number;
  total: number;
  dateFormat: Parameters<typeof formatDate>[1];
}

function TrackLogCard({ log, index, total, dateFormat }: TrackLogCardProps) {
  const uploadFormatted = log.uploadAt ? formatDate(log.uploadAt, dateFormat) : '—';
  const downloadFormatted = log.downloadAt ? formatDate(log.downloadAt, dateFormat) : '—';

  return (
    <li className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            'bg-[#467235] text-white shadow-sm',
          )}
          aria-hidden="true"
        >
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="mt-1 w-px flex-1 bg-[#D1FAE5]" aria-hidden="true" />
        )}
      </div>

      {/* Card body */}
      <div className="mb-6 flex-1 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
        {/* Route row */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[#111827] mb-3">
          <MapPin size={13} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
          <span>{log.originWarehouse || '—'}</span>
          <ArrowRight size={13} className="text-[#9CA3AF]" aria-hidden="true" />
          <span>{log.destinationWarehouse || '—'}</span>
        </div>

        {/* Vehicle info */}
        <div className="flex items-center gap-1.5 text-sm text-[#374151] mb-3">
          <Truck size={13} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">{log.licensePlate}</span>
          <span className="text-[#9CA3AF]">·</span>
          <span className="text-[#6B7280]">{log.vehicleType}</span>
        </div>

        {/* Dates */}
        <dl className="flex flex-wrap gap-x-8 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Ngày lên hàng</dt>
            <dd className="text-xs text-[#374151]">
              <span className="text-[#6B7280] mr-1">Lên hàng</span>
              {uploadFormatted}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Ngày xuống hàng</dt>
            <dd className="text-xs text-[#374151]">
              <span className="text-[#6B7280] mr-1">Xuống hàng</span>
              <span className={log.downloadAt ? '' : 'text-[#9CA3AF]'}>
                {downloadFormatted}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BillOfLadingDetail() {
  const { id } = useParams<{ id: string }>();
  const { dateFormat } = useSettings();

  const { bill, isLoading, notFound, error, refetch } = useBillDetail(id ?? '');

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <SkeletonBillHeader />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-base font-medium text-[#374151]">
          Không tìm thấy vận đơn.
        </p>
        <Link
          to="/bills"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm text-[#467235] hover:text-[#2D5C1E]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 rounded',
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Quay về trang vận đơn
        </Link>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <ErrorState
        message="Failed to load bill of lading details."
        onRetry={refetch}
      />
    );
  }

  if (!bill) return null;

  const { billOverview, billTrackLogs } = bill;

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Bill header ────────────────────────────────────── */}
      <section aria-labelledby="bill-header-heading">
        {/* Title + status */}
        <div className="flex items-center gap-3 mb-4">
          <h1
            id="bill-header-heading"
            className="text-xl font-semibold text-[#111827] tabular-nums"
          >
            Bill {billOverview.billId}
          </h1>
          <StatusBadge status={billOverview.VDtype} />
        </div>

        {/* Meta */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Weight size={14} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Khối lượng</dt>
            <dd className="text-sm text-[#374151]">
              <span className="tabular-nums font-medium">
                {billOverview.actualWeight != null ? formatWeight(billOverview.actualWeight) : '—'}
              </span>
            </dd>
          </div>

          <div className="flex items-center gap-1.5">
            <Truck size={14} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Dịch vụ</dt>
            <dd className="text-sm text-[#374151]">
              <span className="text-[#6B7280] mr-1">Dịch vụ</span>
              {billOverview.service || '—'}
            </dd>
          </div>
        </dl>
      </section>

      <hr className="border-[#E5E7EB]" />

      {/* ── Journey section ─────────────────────────────────── */}
      <section aria-labelledby="journey-heading">
        <h2
          id="journey-heading"
          className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-5"
        >
          Lộ trình ({billTrackLogs.length} chặng)
        </h2>

        {billTrackLogs.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] py-4">Chưa có thông tin lộ trình.</p>
        ) : (
          <ol aria-label="Các chặng vận chuyển" className="list-none p-0 m-0">
            {billTrackLogs.map((log, i) => (
              <TrackLogCard
                key={log.transportTripId}
                log={log}
                index={i}
                total={billTrackLogs.length}
                dateFormat={dateFormat}
              />
            ))}
          </ol>
        )}
      </section>

    </div>
  );
}
