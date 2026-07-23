/**
 * ScheduleResults — displays the outcome of a schedule generation run.
 */

import { AlertCircle, Info, MapPin, Package, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScheduleRun, ScheduledTrip } from '@/types/schedule';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Dusty Rose. */
const EXTERNAL_MODEL_PROVENANCE = '#A25772';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScheduleResultsProps {
  /** The completed or failed schedule run to display, or null when nothing to show. */
  scheduleRun: ScheduleRun | null;
  /** Called when the user clicks Retry on a failed run (restores form inputs). */
  onRetry: () => void;
}

// ---------------------------------------------------------------------------
// Sub-component: TripCard
// ---------------------------------------------------------------------------

interface TripCardProps {
  trip: ScheduledTrip;
}

function TripCard({ trip }: TripCardProps) {
  const { vehicle, originWarehouse, destinationWarehouse, stops, shipmentCount } = trip;

  // Sort stops by sequence number for display
  const orderedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <article
      className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden"
      style={{ borderLeft: `4px solid ${EXTERNAL_MODEL_PROVENANCE}` }}
      aria-label={`Trip for vehicle ${vehicle.name} (${vehicle.plateNumber})`}
    >
      {/* Card header — vehicle identity */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]">
        <Truck
          size={16}
          aria-hidden="true"
          style={{ color: EXTERNAL_MODEL_PROVENANCE }}
          className="shrink-0"
        />
        <div className="min-w-0">
          <span className="font-medium text-[#111827] text-sm truncate block">
            {vehicle.name}
          </span>
          <span className="text-xs text-[#6B7280] font-mono">{vehicle.plateNumber}</span>
        </div>
        {/* Bill count badge */}
        <div className="ml-auto flex items-center gap-1 text-xs text-[#6B7280]">
          <Package size={13} aria-hidden="true" />
          <span>
            {shipmentCount} {shipmentCount === 1 ? 'bill' : 'bills'}
          </span>
        </div>
      </div>

      {/* Origin -> Destination */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] border-b border-[#E5E7EB]">
        <MapPin size={13} aria-hidden="true" className="text-[#6B7280] shrink-0" />
        <span className="font-medium truncate">{originWarehouse}</span>
        <span className="text-[#9CA3AF] mx-1" aria-hidden="true">→</span>
        <span className="font-medium truncate">{destinationWarehouse}</span>
      </div>

      {/* Stop sequence */}
      {orderedStops.length > 0 && (
        <ol className="px-4 py-3 space-y-1.5" aria-label="Stop sequence">
          {orderedStops.map((stop) => (
            <li key={stop.sequence} className="flex items-center gap-2 text-xs text-[#4B5563]">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: EXTERNAL_MODEL_PROVENANCE }}
                aria-label={`Stop ${stop.sequence}`}
              >
                {stop.sequence}
              </span>
              <span>{stop.warehouseName}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: ZeroTripsPanel
// ---------------------------------------------------------------------------

function ZeroTripsPanel() {
  return (
    <div
      className="rounded-lg border p-5 flex gap-3"
      style={{ borderColor: EXTERNAL_MODEL_PROVENANCE, backgroundColor: '#FDF4F7' }}
      role="status"
      aria-label="No routes generated"
    >
      <Info
        size={20}
        aria-hidden="true"
        className="shrink-0 mt-0.5"
        style={{ color: EXTERNAL_MODEL_PROVENANCE }}
      />
      <div>
        <p className="text-sm font-medium" style={{ color: EXTERNAL_MODEL_PROVENANCE }}>
          No routes generated
        </p>
        <p className="text-sm text-[#6B7280] mt-1">
          No routes were generated for the selected period. Please verify that unscheduled
          bills exist in the selected period.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: FailedRunPanel
// ---------------------------------------------------------------------------

interface FailedRunPanelProps {
  errorMessage: string | undefined;
  onRetry: () => void;
}

function FailedRunPanel({ errorMessage, onRetry }: FailedRunPanelProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-5 flex gap-3"
      role="alert"
      aria-label="Schedule generation failed"
    >
      <AlertCircle
        size={20}
        aria-hidden="true"
        className="text-red-500 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">Schedule generation failed</p>
        {errorMessage && (
          <p className="text-sm text-red-700 mt-1 break-words">{errorMessage}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
          aria-label="Retry schedule generation"
        >
          <RefreshCw size={14} className="mr-1.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the results of a completed or failed schedule run.
 * Returns null when `scheduleRun` is null or status is `Pending`.
 */
export function ScheduleResults({ scheduleRun, onRetry }: ScheduleResultsProps) {
  if (!scheduleRun || scheduleRun.status === 'Pending') {
    return null;
  }

  // --- Failed run ---
  if (scheduleRun.status === 'Failed') {
    return (
      <section aria-labelledby="schedule-results-heading">
        <h2 id="schedule-results-heading" className="sr-only">
          Schedule Results
        </h2>
        <FailedRunPanel errorMessage={scheduleRun.errorMessage} onRetry={onRetry} />
      </section>
    );
  }

  // --- Completed run ---
  const { generatedTrips } = scheduleRun;

  return (
    <section aria-labelledby="schedule-results-heading">
      {/* Dusty Rose header strip */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-t-lg"
        style={{ backgroundColor: EXTERNAL_MODEL_PROVENANCE }}
        id="schedule-results-heading"
      >
        <Truck size={16} aria-hidden="true" className="text-white shrink-0" />
        <h2 className="text-sm font-semibold text-white">
          {generatedTrips.length === 0
            ? 'Schedule Generated'
            : `${generatedTrips.length} ${generatedTrips.length === 1 ? 'Trip' : 'Trips'} Generated`}
        </h2>
      </div>

      {/* Results body */}
      <div className="border border-t-0 border-[#E5E7EB] rounded-b-lg p-4 bg-[#FAFAFA]">
        {generatedTrips.length === 0 ? (
          /* Zero-trips case */
          <ZeroTripsPanel />
        ) : (
          /* Per-trip cards */
          <div
            className="grid gap-3"
            role="list"
            aria-label={`${generatedTrips.length} generated trips`}
          >
            {generatedTrips.map((trip) => (
              <div key={trip.tripId} role="listitem">
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ScheduleResults;
