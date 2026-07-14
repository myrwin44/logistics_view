import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  Truck,
  FileText,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavSubItem {
  path: string;
  label: string;
}

interface NavLeaf {
  kind: 'leaf';
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavCollapsible {
  kind: 'collapsible';
  id: string;
  label: string;
  icon: LucideIcon;
  /** Pathnames that mark this group "active" (prefix match) */
  matchPaths: string[];
  items: NavSubItem[];
}

type NavItem = NavLeaf | NavCollapsible;

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'VẬN HÀNH',
    items: [
      { kind: 'leaf', path: '/', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
      {
        kind: 'collapsible',
        id: 'schedule',
        label: 'Lập Lịch',
        icon: CalendarRange,
        matchPaths: ['/schedule', '/schedule-view'],
        items: [
          { path: '/schedule', label: 'Lập Lịch' },
          { path: '/schedule-view', label: 'Xem Lịch Xe' },
        ],
      },
      {
        kind: 'collapsible',
        id: 'transport',
        label: 'Tuyến Xe',
        icon: Truck,
        matchPaths: ['/transport-trips', '/transport-trips/spatial-schedule'],
        items: [
          { path: '/transport-trips', label: 'Thông tin tuyến' },
          { path: '/transport-trips/spatial-schedule', label: 'Xem lộ trình xe' },
        ],
      },
      {
        kind: 'collapsible',
        id: 'bills',
        label: 'Vận Đơn',
        icon: FileText,
        matchPaths: ['/bills'],
        items: [
          { path: '/bills', label: 'Truy xuất đơn hàng' },
        ],
      },
    ],
  },
  {
    label: 'HỆ THỐNG',
    items: [
      { kind: 'leaf', path: '/settings', label: 'Cài Đặt', icon: Settings2 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function isPathActive(itemPath: string, currentPathname: string): boolean {
  if (itemPath === '/') return currentPathname === '/';
  // Exact match only — không dùng startsWith để tránh sub-path match nhầm
  return currentPathname === itemPath;
}

// ─── Leaf item ────────────────────────────────────────────────────────────────

interface LeafItemProps {
  item: NavLeaf;
  collapsed: boolean;
  pathname: string;
}

function LeafItem({ item, collapsed, pathname }: LeafItemProps) {
  const isActive = isPathActive(item.path, pathname);
  const Icon = item.icon;

  const linkEl = (
    <Link
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md text-sm transition-colors duration-150',
        'h-9 w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        collapsed ? 'justify-center px-2' : 'px-3',
        isActive
          ? 'bg-primary text-brand-dark font-semibold'
          : 'text-white/90 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon
        size={17}
        aria-hidden="true"
        className={cn('shrink-0', isActive ? 'text-brand-dark' : 'text-white/80')}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return linkEl;
}

// ─── Collapsible item ─────────────────────────────────────────────────────────

interface CollapsibleItemProps {
  item: NavCollapsible;
  collapsed: boolean;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}

function CollapsibleItem({
  item,
  collapsed,
  pathname,
  isOpen,
  onToggle,
}: CollapsibleItemProps) {
  const isActive = item.matchPaths.some((p) => isPathActive(p, pathname));
  const Icon = item.icon;

  // Icon-only (collapsed) mode: clicking navigates to first sub-item
  if (collapsed) {
    const target = item.items[0]?.path ?? '#';
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={target}
            aria-label={item.label}
            className={cn(
              'flex items-center justify-center rounded-md h-9 w-full transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isActive
                ? 'bg-primary text-brand-dark'
                : 'text-white/85 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon size={17} aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-3 rounded-md text-sm transition-colors duration-150',
          'h-9 px-3 w-full',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          isActive
            ? 'bg-primary text-brand-dark font-semibold'
            : 'text-white/90 hover:bg-white/10 hover:text-white',
        )}
      >
        <Icon
          size={17}
          aria-hidden="true"
          className={cn('shrink-0', isActive ? 'text-brand-dark' : 'text-white/80')}
        />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            'shrink-0 text-white/60 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Sub-items — CSS max-height transition */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l border-white/25 pl-3" role="list">
          {item.items.map((sub) => {
            const subActive = isPathActive(sub.path, pathname);
            return (
              <li key={sub.path}>
                <Link
                  to={sub.path}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    subActive
                      ? 'bg-primary text-brand-dark font-semibold'
                      : 'text-white/85 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {sub.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  // Initialise collapsible open state: auto-open groups whose path is currently active
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.kind === 'collapsible') {
          init[item.id] = item.matchPaths.some((p) => isPathActive(p, pathname));
        }
      }
    }
    return init;
  });

  const toggleItem = React.useCallback((id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const displayName = user?.username ?? '@None';
  const initials = displayName ? getInitials(displayName) : '?';

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        data-sidebar
        className={cn(
          'flex flex-col h-full border-r bg-sidebar-bg border-sidebar-border',
          'transition-[width] duration-200 ease-in-out overflow-hidden shrink-0',
          collapsed ? 'w-14' : 'w-[220px]',
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center h-14 shrink-0 px-3 gap-2.5 border-b border-sidebar-border',
            collapsed && 'justify-center',
          )}
        >
          {/* Logo mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-dark shadow-sm bg-primary">
            <Truck size={15} aria-hidden="true" />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-sm font-semibold text-white truncate">
                Logistics Opt
              </span>
              <span className="text-[10px] truncate" style={{ color: 'var(--sidebar-text-muted)' }}>
                Nền tảng vận hành logistics
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {/* Group label — hidden in icon mode */}
              {!collapsed ? (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest sidebar-group-label"
                  style={{ color: 'var(--sidebar-text-muted)' }}>
                  {group.label}
                </p>
              ) : (
                <div
                  className="my-1 mx-auto h-px w-5 sidebar-divider"
                  style={{ backgroundColor: 'var(--sidebar-border)' }}
                  aria-hidden="true"
                />
              )}

              <ul className="space-y-0.5" role="list">
                {group.items.map((item) =>
                  item.kind === 'leaf' ? (
                    <li key={item.path}>
                      <LeafItem
                        item={item}
                        collapsed={collapsed}
                        pathname={pathname}
                      />
                    </li>
                  ) : (
                    <li key={item.id}>
                      <CollapsibleItem
                        item={item}
                        collapsed={collapsed}
                        pathname={pathname}
                        isOpen={openItems[item.id] ?? false}
                        onToggle={() => toggleItem(item.id)}
                      />
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer: User + Collapse toggle ────────────────────────────── */}
        <div className="shrink-0 p-2 space-y-1 border-t border-sidebar-border">
          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
                'hover:bg-[rgba(255,191,0,0.15)] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                collapsed && 'justify-center px-2',
              )}
              aria-label={collapsed ? 'User menu' : undefined}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-[rgba(255,191,0,0.25)] text-[10px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-white/95 truncate leading-tight">
                    {displayName}
                  </p>
                  {user?.username && (
                    <p className="text-[10px] text-white/65 truncate leading-tight">
                      @{user.username}
                    </p>
                  )}
                </div>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={collapsed ? 'right' : 'top'}
              align="start"
              sideOffset={4}
              className="w-52"
            >
              {/* User info */}
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-[#1F2937] truncate">
                  {displayName}
                </p>
                {user?.username && (
                  <p className="text-xs text-[#9CA3AF] truncate">
                    @{user.username}
                  </p>
                )}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={logout}
                className="cursor-pointer text-[#DC2626] focus:bg-[#FEF2F2] focus:text-[#DC2626]"
              >
                <LogOut size={13} aria-hidden="true" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={cn(
              'flex w-full items-center gap-2 rounded-md h-8 px-2',
              'text-xs text-[rgba(255,255,255,0.65)] hover:text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,191,0,0.12)]',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              collapsed && 'justify-center',
            )}
          >
            {collapsed ? (
              <ChevronRight size={14} aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft size={14} aria-hidden="true" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
