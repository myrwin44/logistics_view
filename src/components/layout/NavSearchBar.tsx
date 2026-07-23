/**
 * NavSearchBar — autocomplete page-navigation search bar.
 *
 * Behaviour mirrors the PrimeNG AutoComplete demo:
 *  - Dropdown opens immediately on focus (shows all pages)
 *  - List filters in real-time as the user types
 *  - First matching item is always pre-highlighted
 *  - Click or Enter on an item navigates to that page
 *  - Escape / blur closes the dropdown
 *
 * Keyboard:
 *  ArrowDown / ArrowUp — move highlight
 *  Enter               — open highlighted page
 *  Escape              — close
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Truck,
  MapPin,
  FileText,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Page registry ────────────────────────────────────────────────────────────

interface PageEntry {
  label: string;
  href: string;
  /** Additional search terms (Vietnamese + English) */
  keywords: string[];
  icon: LucideIcon;
}

const PAGES: PageEntry[] = [
  {
    label: 'Bảng điều khiển',
    href: '/',
    keywords: ['dashboard', 'tổng quan', 'thống kê', 'bảng'],
    icon: LayoutDashboard,
  },
  {
    label: 'Tạo lịch tự động',
    href: '/schedule',
    keywords: ['lập lịch', 'tạo lịch', 'schedule', 'tự động', 'lịch vận chuyển', 'lịch'],
    icon: CalendarRange,
  },
  {
    label: 'Xem lịch xe',
    href: '/schedule-view',
    keywords: ['xem lịch', 'lịch xe', 'schedule view', 'lịch chạy', 'lịch'],
    icon: CalendarDays,
  },
  {
    label: 'Thông tin tuyến xe',
    href: '/transport-trips',
    keywords: ['tuyến xe', 'transport', 'trips', 'chuyến xe', 'xe', 'vận chuyển'],
    icon: Truck,
  },
  {
    label: 'Lộ trình xe',
    href: '/transport-trips/spatial-schedule',
    keywords: ['lộ trình', 'spatial', 'bản đồ', 'map', 'tuyến đường', 'xe'],
    icon: MapPin,
  },
  {
    label: 'Vận đơn',
    href: '/bills',
    keywords: ['bill of lading', 'bills', 'đơn hàng', 'lading', 'vận'],
    icon: FileText,
  },
  {
    label: 'Cài đặt',
    href: '/settings',
    keywords: ['settings', 'thiết lập', 'cấu hình', 'config', 'cài'],
    icon: Settings2,
  },
];

// ─── Filter ───────────────────────────────────────────────────────────────────

function filterPages(query: string): PageEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return PAGES;
  return PAGES.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.keywords.some((kw) => kw.toLowerCase().includes(q)),
  );
}

// ─── Highlight matched text ───────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FEF9C3] text-inherit rounded-[2px] not-italic">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavSearchBar() {
  const navigate = useNavigate();

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeItemRef = React.useRef<HTMLLIElement>(null);

  const suggestions = React.useMemo(() => filterPages(query), [query]);

  // Reset highlight to first item whenever suggestions change
  React.useEffect(() => {
    setActiveIdx(0);
  }, [suggestions]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Close on click outside
  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function openDropdown() {
    setOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        setActiveIdx((i) => (i + 1) % Math.max(suggestions.length, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setOpen(true);
        setActiveIdx((i) =>
          i <= 0 ? Math.max(suggestions.length - 1, 0) : i - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (open && suggestions[activeIdx]) {
          commit(suggestions[activeIdx]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  }

  function commit(page: PageEntry) {
    navigate(page.href);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearQuery() {
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  const showDropdown = open && suggestions.length > 0;
  const showEmpty = open && query.trim().length > 0 && suggestions.length === 0;

  return (
    <div ref={containerRef} className="relative w-72">

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg border bg-white',
          'transition-all duration-150',
          open
            ? 'border-[#467235] shadow-[0_0_0_3px_rgba(70,114,53,0.12)]'
            : 'border-[#E5E7EB] hover:border-[#D1D5DB]',
        )}
      >
        <Search
          size={14}
          aria-hidden="true"
          className={cn(
            'flex-shrink-0 transition-colors duration-150',
            open ? 'text-[#467235]' : 'text-[#9CA3AF]',
          )}
        />

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls="nav-listbox"
          aria-activedescendant={showDropdown ? `nav-item-${activeIdx}` : undefined}
          value={query}
          placeholder="Tìm trang..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          onFocus={openDropdown}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        {query.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Xóa tìm kiếm"
            onPointerDown={(e) => { e.preventDefault(); clearQuery(); }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full
                       text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]
                       transition-colors focus-visible:outline-none"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Dropdown list ─────────────────────────────────────────────── */}
      {showDropdown && (
        <ul
          id="nav-listbox"
          role="listbox"
          aria-label="Gợi ý trang"
          className={cn(
            'absolute top-full mt-1.5 left-0 right-0 z-50',
            'rounded-xl border border-[#E5E7EB] bg-white',
            'shadow-[0_4px_20px_rgba(0,0,0,0.10)]',
            'max-h-80 overflow-y-auto',
            'py-1.5',
          )}
        >
          {suggestions.map((page, idx) => {
            const isActive = idx === activeIdx;
            return (
              <li
                key={page.href}
                id={`nav-item-${idx}`}
                ref={isActive ? activeItemRef : undefined}
                role="option"
                aria-selected={isActive}
                className={cn(
                  'flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg cursor-pointer select-none',
                  'transition-colors duration-100',
                  isActive
                    ? 'bg-[#F0F9EC]'
                    : 'hover:bg-[#F9FAFB]',
                )}
                onPointerDown={(e) => { e.preventDefault(); commit(page); }}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <page.icon
                  size={15}
                  aria-hidden="true"
                  className={cn(
                    'flex-shrink-0 transition-colors duration-100',
                    isActive ? 'text-[#467235]' : 'text-[#9CA3AF]',
                  )}
                />
                <span
                  className={cn(
                    'text-sm transition-colors duration-100',
                    isActive ? 'text-[#1A3D0F] font-medium' : 'text-[#374151]',
                  )}
                >
                  <Highlight text={page.label} query={query} />
                </span>
              </li>
            );
          })}

          {/* Keyboard hint footer */}
          <li
            role="presentation"
            className="mx-1.5 mt-1 pt-1.5 border-t border-[#F3F4F6]
                       flex items-center gap-3 px-3 pb-1"
          >
            <span className="text-[10px] text-[#9CA3AF]">
              <kbd className="font-mono">↑↓</kbd> điều hướng
            </span>
            <span className="text-[10px] text-[#9CA3AF]">
              <kbd className="font-mono">↵</kbd> mở
            </span>
            <span className="text-[10px] text-[#9CA3AF]">
              <kbd className="font-mono">Esc</kbd> đóng
            </span>
          </li>
        </ul>
      )}

      {/* ── No results ────────────────────────────────────────────────── */}
      {showEmpty && (
        <div
          className={cn(
            'absolute top-full mt-1.5 left-0 right-0 z-50',
            'rounded-xl border border-[#E5E7EB] bg-white',
            'shadow-[0_4px_20px_rgba(0,0,0,0.10)]',
            'px-4 py-5 text-center',
          )}
        >
          <p className="text-sm text-[#9CA3AF]">
            Không tìm thấy trang nào cho{' '}
            <span className="text-[#374151] font-medium">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  );
}
