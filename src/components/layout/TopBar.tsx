import * as React from 'react';
import { useMatches, Link } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  CalendarRange,
  Truck,
  FileText,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { cn } from '@/lib/cn';
import type { RouteHandle } from '@/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import {DateRange} from "react-day-picker";
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
// Center navigation menu config
// ---------------------------------------------------------------------------

interface NavMenuEntry {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavMenuSection {
  /** Text shown in the separator label inside the dropdown */
  sectionLabel?: string;
  entries: NavMenuEntry[];
}

interface NavMenuGroup {
  trigger: string;
  sections: NavMenuSection[];
}

const NAV_MENU: NavMenuGroup[] = [
  {
    trigger: 'Vận hành',
    sections: [
      {
        entries: [
          { label: 'Lập lịch', href: '/schedule', icon: CalendarRange },
          { label: 'Tuyến xe', href: '/transport-trips', icon: Truck },
          { label: 'Vận đơn', href: '/bills', icon: FileText },
        ],
      },
    ],
  },
  {
    trigger: 'Báo cáo',
    sections: [
      {
        entries: [
          { label: 'Bảng điều khiển', href: '/', icon: LayoutDashboard },
        ],
      },
    ],
  },
  {
    trigger: 'Hệ thống',
    sections: [
      {
        entries: [
          { label: 'Cài đặt', href: '/settings', icon: Settings2 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// CenterNavMenu
// ---------------------------------------------------------------------------

function CenterNavMenu() {
  return (
    <nav
      aria-label="Global navigation"
      className="flex items-center gap-0.5"
    >
      {NAV_MENU.map((group) => (
        <DropdownMenu key={group.trigger}>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium',
              'text-gray-700 transition-colors duration-150',
              'hover:bg-primary-light hover:text-brand-dark',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'data-[state=open]:bg-primary-light data-[state=open]:text-brand-dark',
            )}
          >
            {group.trigger}
            <ChevronDown
              size={12}
              aria-hidden="true"
              className="text-gray-400 transition-transform duration-150 [[data-state=open]_&]:rotate-180"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="center" sideOffset={6} className="min-w-44">
            {group.sections.map((section, si) => (
              <React.Fragment key={si}>
                {si > 0 && <DropdownMenuSeparator />}
                {section.sectionLabel && (
                  <DropdownMenuLabel>{section.sectionLabel}</DropdownMenuLabel>
                )}
                {section.entries.map((entry) => (
                  <DropdownMenuItem key={entry.href} asChild className="cursor-pointer gap-2">
                    <Link to={entry.href}>
                      <entry.icon
                        size={14}
                        className="text-gray-400"
                        aria-hidden="true"
                      />
                      {entry.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// GlobalDateRangePicker
// ---------------------------------------------------------------------------

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
    // Guard: do not propagate an invalid range to the store
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
      label="Khoảng thời gian"
    />
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

export default function TopBar() {
  const matches = useMatches();

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
        'border-b border-border bg-white px-4 overflow-hidden',
      )}
    >
      {/* Left: breadcrumb — fixed width to help center the nav menu */}
      <div className="flex items-center min-w-0 flex-1">
        {breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
      </div>

      {/* Center: global navigation menu */}
      <div className="flex items-center justify-center shrink-0">
        <CenterNavMenu />
      </div>

      {/* Right: global date range picker — mirrors left flex-1 so nav stays centered */}
      <div className="flex items-center justify-end flex-1">
        <GlobalDateRangePicker />
      </div>
    </header>
  );
}
