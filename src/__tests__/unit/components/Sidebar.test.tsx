/**
 * Unit tests for src/components/layout/Sidebar.tsx
 *
 * Covers:
 * - Renders <nav aria-label="Main navigation"> (Req 2.1)
 * - Nav items are present in expanded state
 * - Active item detection: aria-current="page" on the matched item (Req 2.3)
 * - Collapse toggle button: aria-label / aria-expanded (Req 2.5, 2.8)
 *
 * Requirements: 2.1, 2.3, 2.5, 2.8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/layout/Sidebar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RenderSidebarOptions {
  path?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

function renderSidebar({
  path = '/',
  collapsed = false,
  onToggle = vi.fn(),
}: RenderSidebarOptions = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Sidebar collapsed={collapsed} onToggle={onToggle} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Nav items as they appear in the actual component (Vietnamese)
// ---------------------------------------------------------------------------

// Note: defined for documentation purposes — test assertions use inline strings
// matching the actual rendered text from the component
const _NAV_ITEMS_REF = [
  { label: 'Bảng Điều Khiển', path: '/' },
  { label: 'Lập Lịch', path: '/schedule' },
  { label: 'Tuyến Xe', path: '/transport-trips' },
  { label: 'Vận Đơn', path: '/bills' },
  { label: 'Cài Đặt', path: '/settings' },
] as const; void _NAV_ITEMS_REF;

// ---------------------------------------------------------------------------
// Tests — Expanded state
// ---------------------------------------------------------------------------

describe('Sidebar (expanded)', () => {
  it('renders a <nav> with aria-label="Main navigation"', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders nav item labels', () => {
    renderSidebar();
    // Check a few key labels that are always visible (leaf items and collapsed triggers)
    expect(screen.getByText('Bảng Điều Khiển')).toBeInTheDocument();
    expect(screen.getByText('Cài Đặt')).toBeInTheDocument();
  });

  describe('active item (Dashboard at /)', () => {
    it('marks the active Dashboard link with aria-current="page"', () => {
      renderSidebar({ path: '/' });
      const dashboardLink = screen.getByRole('link', { name: 'Bảng Điều Khiển' });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('Settings link is NOT active at /', () => {
      renderSidebar({ path: '/' });
      expect(screen.getByRole('link', { name: 'Cài Đặt' })).not.toHaveAttribute('aria-current');
    });

    it('active link has active background class bg-[#FFBF00]', () => {
      renderSidebar({ path: '/' });
      expect(screen.getByRole('link', { name: 'Bảng Điều Khiển' })).toHaveClass('bg-[#FFBF00]');
    });

    it('active link has text color class text-[#283F24]', () => {
      renderSidebar({ path: '/' });
      expect(screen.getByRole('link', { name: 'Bảng Điều Khiển' })).toHaveClass('text-[#283F24]');
    });

    it('active link has font-semibold', () => {
      renderSidebar({ path: '/' });
      expect(screen.getByRole('link', { name: 'Bảng Điều Khiển' })).toHaveClass('font-semibold');
    });
  });

  describe('active item (Settings at /settings)', () => {
    it('marks Settings link with aria-current="page"', () => {
      renderSidebar({ path: '/settings' });
      expect(screen.getByRole('link', { name: 'Cài Đặt' })).toHaveAttribute('aria-current', 'page');
    });

    it('Dashboard link is NOT active at /settings', () => {
      renderSidebar({ path: '/settings' });
      expect(screen.getByRole('link', { name: 'Bảng Điều Khiển' })).not.toHaveAttribute('aria-current');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Collapse toggle button
// ---------------------------------------------------------------------------

describe('Sidebar collapse toggle', () => {
  it('toggle button has aria-label="Collapse sidebar"', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('toggle button has aria-expanded=true when expanded', () => {
    renderSidebar({ collapsed: false });
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('toggle button has aria-expanded=false when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('calls onToggle when the button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggle });
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Tests — Collapsed state
// ---------------------------------------------------------------------------

describe('Sidebar (collapsed)', () => {
  it('icons are rendered with aria-hidden="true"', () => {
    const { container } = renderSidebar({ collapsed: true });
    const icons = container.querySelectorAll('nav svg[aria-hidden="true"]');
    // At least the nav icons should be present
    expect(icons.length).toBeGreaterThan(0);
  });

  it('each collapsed leaf link has aria-label', () => {
    renderSidebar({ collapsed: true });
    // In collapsed mode, leaf links get aria-label
    const dashboardLink = screen.getByRole('link', { name: 'Bảng Điều Khiển' });
    expect(dashboardLink).toBeInTheDocument();
  });
});
