/**
 * useToast — extracted from Settings.tsx toast management logic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseToastResult {
  isOpen: boolean;
  show: () => void;
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages a toast's open/close state with auto-dismiss.
 *
 * @param durationMs - How long (ms) the toast stays visible before auto-dismissing. Defaults to 3000.
 */
export function useToast(durationMs: number = 3000): UseToastResult {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const show = useCallback(() => {
    // Reset first so CSS transitions can restart from the beginning,
    // then re-open on the next animation frame.
    setIsOpen(false);
    requestAnimationFrame(() => {
      setIsOpen(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsOpen(false), durationMs);
    });
  }, [durationMs]);

  // Clear the timer when the component that owns the toast unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isOpen, show, dismiss };
}
