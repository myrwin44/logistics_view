import { MapPin, Clock } from 'lucide-react';
import { ShipmentPill } from '@/components/shared/ShipmentPill';
import type { TripStop } from '@/types/tripStop';

interface TripStopTimelineProps {
  stops: TripStop[];
}

/**
 * TripStopTimeline renders an ordered vertical timeline of trip stops.
 */
export function TripStopTimeline({ stops }: TripStopTimelineProps) {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[#6B7280]">No stops available for this trip.</p>
    );
  }

  return (
    <ol className="relative" aria-label="Trip stop timeline">
      {sorted.map((stop, index) => {
        const isLast = index === sorted.length - 1;

        return (
          <li key={stop.id} className="relative flex gap-4">
            {/* Timeline spine: circle marker + vertical connecting line */}
            <div className="flex flex-col items-center flex-shrink-0 w-8">
              {/* Circle marker for this stop */}
              <div
                className="w-8 h-8 rounded-full bg-[#FFF78D] border-2 border-[#FFBF00] flex items-center justify-center flex-shrink-0 z-10"
                aria-hidden="true"
              >
                <span className="text-xs font-semibold text-[#283F24]">
                  {stop.sequence}
                </span>
              </div>
              {/* Vertical connecting line (hidden for last stop) */}
              {!isLast && (
                <div
                  className="flex-1 w-px min-h-4 mt-1"
                  style={{ backgroundColor: '#E5E7EB' }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Stop panel content */}
            <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
              {/* Header — sequence number + warehouse name */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">
                  Stop {stop.sequence} — {stop.warehouseName}
                </h3>
              </div>

              {/* Warehouse location */}
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2">
                <MapPin size={12} aria-hidden="true" />
                <span>{stop.warehouseLocation}</span>
              </div>

              {/* Arrival and departure times */}
              <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-4">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" />
                  <span>
                    <span className="font-medium text-[#374151]">Arrival:</span>{' '}
                    {formatTime(stop.scheduledArrival)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" />
                  <span>
                    <span className="font-medium text-[#374151]">Departure:</span>{' '}
                    {formatTime(stop.scheduledDeparture)}
                  </span>
                </span>
              </div>

              {/* Two groups — Loaded and Unloaded */}
              <div className="flex flex-col gap-3">
                {/* Loaded group */}
                <div>
                  <p className="text-xs font-medium text-[#374151] mb-1.5">Loaded</p>
                  {stop.loadedBills.length > 0 ? (
                    /* ShipmentPill with load action */
                    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Bills loaded at this stop">
                      {stop.loadedBills.map((bill) => (
                        <div key={bill.billId} role="listitem">
                          <ShipmentPill billId={bill.billId} action="load" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty loaded group text */
                    <p className="text-xs text-[#9CA3AF] italic">
                      No bills loaded at this stop
                    </p>
                  )}
                </div>

                {/* Unloaded group */}
                <div>
                  <p className="text-xs font-medium text-[#374151] mb-1.5">Unloaded</p>
                  {stop.unloadedBills.length > 0 ? (
                    /* ShipmentPill with unload action */
                    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Bills unloaded at this stop">
                      {stop.unloadedBills.map((bill) => (
                        <div key={bill.billId} role="listitem">
                          <ShipmentPill billId={bill.billId} action="unload" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty unloaded group text */
                    <p className="text-xs text-[#9CA3AF] italic">
                      No bills unloaded at this stop
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Formats an ISO datetime string to a human-readable time (HH:mm).
 * Falls back to the raw string if parsing fails.
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
  }
}

export default TripStopTimeline;
