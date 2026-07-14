import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resolveDefaultDateRange } from '../lib/dateFormat';

interface GlobalDateRange {
  startDate: string; // ISO YYYY-MM-DD, e.g. "2024-01-01"
  endDate: string;   // ISO YYYY-MM-DD, e.g. "2024-01-31"
}

interface UIState {
  globalDateRange: GlobalDateRange;
  setGlobalDateRange: (range: GlobalDateRange) => void;
}

/**
 * Global UI store for shared client state.
 *
 * - `globalDateRange` is persisted to sessionStorage (key: 'lgts_global_date_range')
 *   so it survives page reloads (F5) but resets when the tab is closed.
 * - Default value is the last 30 days.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      globalDateRange: resolveDefaultDateRange('last30'),
      setGlobalDateRange: (range) => set({ globalDateRange: range }),
    }),
    {
      name: 'lgts_global_date_range',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
