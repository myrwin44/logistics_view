import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsCarouselProps {
  /** Titles for each slide shown in the tab-like navigation header */
  slides: { title: string; content: React.ReactNode }[];
  className?: string;
}

// ─── StatsCarousel ────────────────────────────────────────────────────────────

/**
 * A lightweight carousel that wraps multiple statistics panels.
 * Navigation via previous/next arrow buttons and dot/tab indicators.
 * Keyboard-accessible: arrow keys move between slides when the carousel is focused.
 */
export function StatsCarousel({ slides, className }: StatsCarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const total = slides.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  }

  if (total === 0) return null;

  return (
    <div
      className={cn('rounded-xl border border-border bg-white shadow-sm overflow-hidden', className)}
      onKeyDown={handleKeyDown}
    >
      {/* ── Tab header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 bg-gray-50">
        {/* Slide tabs */}
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Statistics sections">
          {slides.map((slide, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={current === i}
              aria-controls={`carousel-panel-${i}`}
              id={`carousel-tab-${i}`}
              onClick={() => setCurrent(i)}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150',
                current === i
                  ? 'border-primary text-brand-dark font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300',
              )}
            >
              {slide.title}
            </button>
          ))}
        </div>

        {/* Prev / Next controls */}
        {total > 1 && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={prev}
              aria-label="Previous statistics panel"
              className={cn(
                'rounded-md p-1.5 text-gray-500 transition-colors',
                'hover:bg-primary-light hover:text-brand-dark',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="text-xs text-gray-400 tabular-nums">
              {current + 1} / {total}
            </span>
            <button
              onClick={next}
              aria-label="Next statistics panel"
              className={cn(
                'rounded-md p-1.5 text-gray-500 transition-colors',
                'hover:bg-primary-light hover:text-brand-dark',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* ── Slide content ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="tabpanel"
            id={`carousel-panel-${i}`}
            aria-labelledby={`carousel-tab-${i}`}
            hidden={current !== i}
            className="p-5"
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* ── Dot indicators ──────────────────────────────────────────────────── */}
      {total > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pb-3"
          aria-label="Carousel position indicator"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-200',
                current === i
                  ? 'w-5 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-gray-300 hover:bg-primary-light',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StatsCarousel;
