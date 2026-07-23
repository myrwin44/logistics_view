import * as React from 'react';
import { useMatches, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import Breadcrumb from './Breadcrumb';
import { NavSearchBar } from './NavSearchBar';
import { cn } from '@/lib/cn';
import type { RouteHandle } from '@/router';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// Route-to-label map  (used for breadcrumb only)
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Bảng Điều Khiển',
  '/schedule': 'Lập Lịch Vận Chuyển',
  '/transport-trips': 'Tuyến Xe',
  '/bills': 'Vận Đơn',
  '/settings': 'Cài Đặt',
};

// ---------------------------------------------------------------------------
// Route → query key map (for invalidation on refresh)
// ---------------------------------------------------------------------------

const ROUTE_QUERY_KEYS: Record<string, unknown[][]> = {
  '/':                              [['dashboard']],
  '/schedule':                      [['schedule']],
  '/schedule-view':                 [['gantt-schedule']],
  '/transport-trips':               [['transport-trips']],
  '/transport-trips/spatial-schedule': [['transport-trips']],
  '/bills':                         [['bills']],
};

// ---------------------------------------------------------------------------
// GlobalRefreshButton — invalidates TanStack Query cache for current route
// ---------------------------------------------------------------------------

function GlobalRefreshButton() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = React.useState(false);

  async function handleRefresh() {
    if (spinning) return;
    setSpinning(true);

    // Derive base path (strip dynamic segments like /transport-trips/123)
    const basePath = '/' + location.pathname.split('/').slice(1, 3).join('/');
    const keys = ROUTE_QUERY_KEYS[basePath] ?? ROUTE_QUERY_KEYS[location.pathname];

    if (keys) {
      await Promise.all(
        keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
    } else {
      // Fallback: invalidate everything
      await queryClient.invalidateQueries();
    }

    // Keep spinner visible for at least 600ms so it doesn't flicker
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <button
      type="button"
      aria-label="Tải lại dữ liệu trang hiện tại"
      onClick={handleRefresh}
      disabled={spinning}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg border border-[#E5E7EB]',
        'bg-white text-[#6B7280] transition-colors duration-150',
        'hover:border-[#D1D5DB] hover:text-[#374151] hover:bg-[#F9FAFB]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00]/50',
        'disabled:opacity-60 disabled:cursor-not-allowed',
      )}
    >
      <RefreshCw
        size={14}
        aria-hidden="true"
        className={spinning ? 'animate-spin' : ''}
      />
    </button>
  );
}

/**
 * Parses a YYYY-MM-DD string to a local-timezone Date (midnight local time).
 * Using `new Date("YYYY-MM-DD")` parses as UTC midnight, which shifts the date
 * back by UTC+offset hours in local time. This helper avoids that bug.
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Renders the global date range picker in the TopBar.
 *
 * - Reads `globalDateRange` from Zustand store as the initial value.
 * - Maintains local `pickerDateRange` state so edits are not
 *   propagated until the user clicks "Áp dụng".
 * - The underlying `DateRangePicker` uses a calendar-based picker with horizontal label layout.
 * - The `handleApply` guard prevents `setGlobalDateRange` from being called
 *   with an invalid range.
 * - Returns `null` when the user is not authenticated.
 */
export function GlobalDateRangePicker() {
  const { globalDateRange, setGlobalDateRange } = useUIStore();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Track whether any query related to the current route is fetching
  // so we can show the spinner on the apply button
  const routeQueryKey = ROUTE_QUERY_KEYS[location.pathname]?.[0]?.[0] as string | undefined;
  const isFetching = useIsFetching(
    routeQueryKey ? { queryKey: [routeQueryKey] } : undefined,
  ) > 0;

  const [pickerDateRange, setPickerDateRange] = React.useState<DateRange | undefined>(() => ({
    from: parseDateString(globalDateRange.startDate),
    to: parseDateString(globalDateRange.endDate),
  }));

  // Sync local state if the store value changes externally (e.g. sessionStorage restore)
  React.useEffect(() => {
    setPickerDateRange({
      from: parseDateString(globalDateRange.startDate),
      to: parseDateString(globalDateRange.endDate),
    });
  }, [globalDateRange.startDate, globalDateRange.endDate]);

  if (!isAuthenticated) return null;

  function handleApply() {
    if (!pickerDateRange?.from || !pickerDateRange?.to) return;
    if (pickerDateRange.to < pickerDateRange.from) return;

    setGlobalDateRange({
      startDate: format(pickerDateRange.from, 'yyyy-MM-dd'),
      endDate: format(pickerDateRange.to, 'yyyy-MM-dd'),
    });
  }

  return (
    <DateRangePicker
      startDate={pickerDateRange?.from}
      endDate={pickerDateRange?.to}
      onDateChange={setPickerDateRange}
      onApply={handleApply}
      isLoading={isFetching}
      label="Khoảng thời gian"
    />
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

export default function TopBar() {
  const matches = useMatches();
  const location = useLocation();

  // Check if any matched route supplies breadcrumb items via handle.crumb
  const handleMatch = [...matches].reverse().find(
    (m) => (m.handle as RouteHandle | undefined)?.crumb !== undefined,
  );

  let breadcrumbItems: Array<{ label: string; href?: string }>;

  if (handleMatch) {
    // Dynamic detail routes supply the full crumb chain
    const handle = handleMatch.handle as RouteHandle;
    breadcrumbItems = handle.crumb!(
      handleMatch.params as Record<string, string | undefined>,
      location.state,
    );
  } else {
    // ── FIX: only use the single leaf (most-specific) matching route ──────────
    // Previously all matches were collected, causing "Dashboard" to appear as a
    // parent on every page because the AppShell layout route also resolves to "/".
    const leafMatch = [...matches]
      .reverse()
      .find(
        (m) => m.pathname !== '' && ROUTE_LABELS[m.pathname] !== undefined,
      );
    breadcrumbItems = leafMatch
      ? [{ label: ROUTE_LABELS[leafMatch.pathname], href: leafMatch.pathname }]
      : [];
  }

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between',
        'border-b border-border bg-white px-4',
      )}
    >
      {/* Left: breadcrumb — fixed width to help center the nav menu */}
      <div className="flex items-center min-w-0 flex-1">
        {breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
      </div>

      {/* Center: autocomplete search bar */}
      <div className="flex items-center justify-center shrink-0">
        <NavSearchBar />
      </div>

      {/* Right: date range picker + refresh button */}
      <div className="flex items-center justify-end gap-2 flex-1">
        <GlobalDateRangePicker />
        <GlobalRefreshButton />
      </div>
    </header>
  );
}
