import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import KeepAlive from 'keepalive-for-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';

// ---------------------------------------------------------------------------
// localStorage key for sidebar collapsed state
// ---------------------------------------------------------------------------
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export default function AppShell() {
  // Initialize from localStorage so the preference survives page reloads
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  );

  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const outlet = useOutlet();

  // cacheKey distinguishes each route in the KeepAlive cache
  const cacheKey = useMemo(() => {
    return location.pathname + location.search;
  }, [location]);

  // Focus <main> on every route change to aid keyboard navigation
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  // Scroll restoration for <main> element across route navigations
  useScrollRestoration(mainRef);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />

        <main
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 overflow-auto p-6 bg-white outline-none min-w-0"
        >
          {/* KeepAlive wraps outlet with max=5 LRU strategy */}
          <KeepAlive activeName={cacheKey} max={5} strategy="LRU">
            {outlet}
          </KeepAlive>
        </main>
      </div>
    </div>
  );
}
