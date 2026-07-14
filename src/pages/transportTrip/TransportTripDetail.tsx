import { Link, useParams } from 'react-router-dom';
import { Truck, Calendar, Weight, Package, ArrowLeft } from 'lucide-react';
import { useTransportTripDetail } from '@/hooks/useTransportTripDetail';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { TripStopTimeline } from '@/pages/tripStop/TripStopTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/contexts/SettingsContext';
import { formatDate } from '@/lib/dateFormat';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Skeleton sub-components
// ---------------------------------------------------------------------------

/** Skeleton for the trip header area */
function SkeletonTripHeader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading trip details">
      {/* Trip ID + status row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* Vehicle */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Meta row: date, weight, bills */}
      <div className="flex flex-wrap gap-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/** Skeleton for the timeline area */
function SkeletonTimeline() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading trip stops">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          {/* Spine circle */}
          <div className="flex flex-col items-center w-8 flex-shrink-0">
            <Skeleton className="w-8 h-8 rounded-full" />
            {i < 2 && <Skeleton className="w-px flex-1 min-h-12 mt-1" />}
          </div>
          {/* Stop content */}
          <div className="flex-1 pb-6 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * TransportTripDetail — detail view for a single transport trip.
 */
export default function TransportTripDetail() {
  const { id } = useParams<{ id: string }>();
  const { dateFormat } = useSettings();

  const { trip, stops, isLoading, notFound, error, refetch } = useTransportTripDetail(id ?? '');

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <SkeletonTripHeader />
        <div>
          <Skeleton className="h-5 w-24 mb-4" />
          <SkeletonTimeline />
        </div>
      </div>
    );
  }

  // ── Not found state ───────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-base font-medium text-[#374151]">Transport trip not found</p>
        <Link
          to="/transport-trips"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm text-[#467235] hover:text-[#2D5C1E]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 rounded',
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Transport Trips
        </Link>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <ErrorState
        message="Failed to load transport trip details."
        onRetry={refetch}
      />
    );
  }

  // ── No trip data (shouldn't happen without error/notFound, but guard) ──
  if (!trip) {
    return null;
  }

  // ── Header content ────────────────────────────────────────────
  const scheduledDateFormatted = formatDate(trip.scheduledDate, dateFormat);

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Trip header ─────────────────────────────────────────────────── */}
      <section aria-labelledby="trip-header-heading">
        {/* Title row: Trip ID + Status badge */}
        <div className="flex items-center gap-3 mb-3">
          <h1
            id="trip-header-heading"
            className="text-xl font-semibold text-[#111827] tabular-nums"
          >
            Trip {trip.id}
          </h1>
          <StatusBadge status={trip.status} />
        </div>

        {/* Vehicle name + plate */}
        <div className="flex items-center gap-2 text-sm text-[#374151] mb-4">
          <Truck size={15} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">{trip.vehicle.name}</span>
            <span className="text-[#6B7280] ml-1">· {trip.vehicle.plateNumber}</span>
          </span>
        </div>

        {/* Meta: scheduled date, total weight, bill count */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Scheduled date</dt>
            <dd className="text-sm text-[#374151]">{scheduledDateFormatted}</dd>
          </div>

          <div className="flex items-center gap-1.5">
            <Weight size={14} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Total weight</dt>
            <dd className="text-sm text-[#374151]">
              <span className="tabular-nums font-medium">{trip.totalWeightKg.toLocaleString()}</span>
              <span className="text-[#6B7280] ml-1">kg</span>
            </dd>
          </div>

          <div className="flex items-center gap-1.5">
            <Package size={14} className="text-[#9CA3AF] flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Shipment bill count</dt>
            <dd className="text-sm text-[#374151]">
              <span className="tabular-nums font-medium">{trip.shipmentCount}</span>
              <span className="text-[#6B7280] ml-1">{trip.shipmentCount === 1 ? 'bill' : 'bills'}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <hr className="border-[#E5E7EB]" />

      {/* ── Trip stop timeline ──────────────────────────────────── */}
      <section aria-labelledby="timeline-heading">
        <h2
          id="timeline-heading"
          className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-5"
        >
          Route
        </h2>
        <TripStopTimeline stops={stops} />
      </section>

    </div>
  );
}
