import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Weight,
  ArrowLeft,
  Info,
  ClipboardList,
} from 'lucide-react';
import { useBillDetail } from '@/hooks/useBillDetail';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { ShipmentPill } from '@/components/shared/ShipmentPill';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/contexts/SettingsContext';
import { formatDate } from '@/lib/dateFormat';
import { cn } from '@/lib/cn';
import type { BillJourneyStop } from '@/types/billOfLading';

// ---------------------------------------------------------------------------
// Skeleton sub-components
// ---------------------------------------------------------------------------

/** Skeleton for the bill header area */
function SkeletonBillHeader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading bill details">
      {/* Bill ID + status row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      {/* Origin / destination */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Meta row: weight, created date, scheduled date */}
      <div className="flex flex-wrap gap-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/** Skeleton for the journey timeline area */
function SkeletonJourneyTimeline() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading journey timeline">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-[#E5E7EB] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journey stop card
// ---------------------------------------------------------------------------

interface JourneyStopCardProps {
  stop: BillJourneyStop;
  dateFormat: ReturnType<typeof useSettings>['dateFormat'];
}

function JourneyStopCard({ stop, dateFormat }: JourneyStopCardProps) {
  const arrivalFormatted = formatDate(stop.scheduledArrival, dateFormat);

  return (
    <li className="rounded-lg border border-[#E5E7EB] bg-white p-4 space-y-3">
      {/* Header row: sequence badge + trip link */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Sequence number badge */}
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FFF78D] text-[#283F24] text-xs font-semibold tabular-nums flex-shrink-0"
            aria-label={`Stop ${stop.sequence}`}
          >
            {stop.sequence}
          </span>
          {/* Warehouse name */}
          <span className="text-sm font-medium text-[#111827]">
            {stop.warehouseName}
          </span>
        </div>

        {/* Trip ID link */}
        <Link
          to={`/transport-trips/${stop.tripId}`}
          className={cn(
            'text-xs font-mono text-[#467235] hover:text-[#2D5C1E] underline-offset-2 hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 rounded',
          )}
          aria-label={`View transport trip ${stop.tripId}`}
        >
          Trip {stop.tripId}
        </Link>
      </div>

      {/* Arrival time */}
      <div className="flex items-center gap-1.5">
        <Calendar
          size={13}
          className="text-[#9CA3AF] flex-shrink-0"
          aria-hidden="true"
        />
        <dt className="sr-only">Scheduled arrival</dt>
        <dd className="text-xs text-[#6B7280]">{arrivalFormatted}</dd>
      </div>

      {/* Load / unload indicator — ShipmentPill pattern */}
      <div>
        <ShipmentPill billId="" action={stop.action} />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * BillOfLadingDetail — detail view for a single shipment bill.
 */
export default function BillOfLadingDetail() {
  const { id } = useParams<{ id: string }>();
  const { dateFormat } = useSettings();

  const { bill, isLoading, notFound, error, refetch } = useBillDetail(id ?? '');

  // ── Loading state ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <SkeletonBillHeader />
        <div>
          <Skeleton className="h-5 w-28 mb-4" />
          <SkeletonJourneyTimeline />
        </div>
      </div>
    );
  }

  // ── Not found state ──────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-base font-medium text-[#374151]">
          Shipment bill not found
        </p>
        <Link
          to="/bills"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm text-[#467235] hover:text-[#2D5C1E]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 rounded',
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Bills of Lading
        </Link>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <ErrorState
        message="Failed to load bill of lading details."
        onRetry={refetch}
      />
    );
  }

  // ── Guard: no bill data without error/notFound ─────────────────────────
  if (!bill) {
    return null;
  }

  // ── Derived values ───────────────────────────────────────────
  const createdDateFormatted = formatDate(bill.createdDate, dateFormat);
  const scheduledDateFormatted = bill.scheduledDate
    ? formatDate(bill.scheduledDate, dateFormat)
    : '—';

  // Sort journey stops by sequence ascending
  const sortedStops = [...bill.journey].sort((a, b) => a.sequence - b.sequence);

  const isUnscheduled = bill.status === 'Unscheduled';

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Bill header ──────────────────────────────────────── */}
      <section aria-labelledby="bill-header-heading">
        {/* Title row: Bill ID + Status badge */}
        <div className="flex items-center gap-3 mb-3">
          <h1
            id="bill-header-heading"
            className="text-xl font-semibold text-[#111827] tabular-nums"
          >
            Bill {bill.id}
          </h1>
          {/* Same badge mapping as Req 9.4 */}
          <StatusBadge status={bill.status} />
        </div>

        {/* Origin → destination */}
        <div className="flex items-center gap-2 text-sm text-[#374151] mb-4">
          <MapPin
            size={15}
            className="text-[#9CA3AF] flex-shrink-0"
            aria-hidden="true"
          />
          <span>
            <span className="font-medium">{bill.originWarehouse}</span>
            <span className="text-[#6B7280] mx-1.5">→</span>
            <span className="font-medium">{bill.destinationWarehouse}</span>
          </span>
        </div>

        {/* Meta: weight, created date, scheduled date */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Weight
              size={14}
              className="text-[#9CA3AF] flex-shrink-0"
              aria-hidden="true"
            />
            <dt className="sr-only">Weight</dt>
            <dd className="text-sm text-[#374151]">
              <span className="tabular-nums font-medium">
                {bill.weightKg.toLocaleString()}
              </span>
              <span className="text-[#6B7280] ml-1">kg</span>
            </dd>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar
              size={14}
              className="text-[#9CA3AF] flex-shrink-0"
              aria-hidden="true"
            />
            <dt className="sr-only">Created date</dt>
            <dd className="text-sm text-[#374151]">
              <span className="text-[#6B7280] mr-1">Created</span>
              {createdDateFormatted}
            </dd>
          </div>

          <div className="flex items-center gap-1.5">
            <ClipboardList
              size={14}
              className="text-[#9CA3AF] flex-shrink-0"
              aria-hidden="true"
            />
            <dt className="sr-only">Scheduled date</dt>
            <dd className="text-sm text-[#374151]">
              <span className="text-[#6B7280] mr-1">Scheduled</span>
              <span className={bill.scheduledDate ? '' : 'text-[#9CA3AF]'}>
                {scheduledDateFormatted}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <hr className="border-[#E5E7EB]" />

      {/* ── Journey section ──────────────────────────── */}
      <section aria-labelledby="journey-heading">
        <h2
          id="journey-heading"
          className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-5"
        >
          Journey
        </h2>

        {/* Unscheduled info banner */}
        {isUnscheduled && (
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3 mb-6 bg-[#EFF6FF]"
            role="note"
            aria-live="polite"
          >
            <Info
              size={16}
              className="text-[#2563EB] flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-[#2563EB]">
              This bill has not been assigned to a transport schedule yet.
            </p>
          </div>
        )}

        {/* Ordered list of journey stops */}
        {sortedStops.length > 0 ? (
          <ol className="space-y-3" aria-label="Journey stops">
            {sortedStops.map((stop) => (
              <JourneyStopCard
                key={`${stop.tripId}-${stop.sequence}`}
                stop={stop}
                dateFormat={dateFormat}
              />
            ))}
          </ol>
        ) : (
          /* Empty journey — only shown for non-Unscheduled bills with no stops */
          !isUnscheduled && (
            <p className="text-sm text-[#6B7280] py-4">
              No journey stops recorded for this bill.
            </p>
          )
        )}
      </section>

    </div>
  );
}
