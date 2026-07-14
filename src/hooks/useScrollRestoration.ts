import * as React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook khôi phục vị trí cuộn của phần tử <main> khi navigate giữa các route.
 * - Lưu scrollTop của mainRef.current vào scrollMap theo pathname khi navigate đi.
 * - Khôi phục scrollTop từ scrollMap (hoặc 0 nếu chưa có) khi navigate đến route.
 */
export function useScrollRestoration(mainRef: React.RefObject<HTMLElement>) {
  const location = useLocation();
  const scrollMap = React.useRef<Map<string, number>>(new Map());

  // Lưu scroll position khi navigate đi (cleanup function chạy trước effect tiếp theo)
  React.useEffect(() => {
    const key = location.pathname;
    return () => {
      if (mainRef.current) {
        scrollMap.current.set(key, mainRef.current.scrollTop);
      }
    };
  }, [location.pathname, mainRef]);

  // Khôi phục scroll position khi navigate đến route
  React.useEffect(() => {
    const saved = scrollMap.current.get(location.pathname);
    if (mainRef.current) {
      mainRef.current.scrollTop = saved ?? 0;
    }
  }, [location.pathname, mainRef]);
}
