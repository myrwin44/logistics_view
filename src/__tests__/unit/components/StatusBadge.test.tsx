/**
 * Unit tests for src/components/shared/StatusBadge.tsx
 *
 * For each of the 8 status values:
 * - Renders the correct label text
 * - Has role="status"
 * - Has aria-label equal to the label text
 * - Renders an icon with aria-hidden="true"
 * - Applies the correct CSS color (textClass) to the badge element
 *
 * Requirements: 6.7, 9.4
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import type { TripStatus } from '../../../types/transportTrip';
import type { BillStatus } from '../../../types/billOfLading';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatusValue = TripStatus | BillStatus;

interface ExpectedConfig {
  label: string;
  bgClass: string;
  textClass: string;
}

const STATUS_EXPECTATIONS: Record<StatusValue, ExpectedConfig> = {
  // TripStatus
  Pending:       { label: 'Pending',     bgClass: 'bg-[#EFF6FF]', textClass: 'text-[#2563EB]' },
  'In Progress': { label: 'In Progress', bgClass: 'bg-[#FFFBEB]', textClass: 'text-[#D97706]' },
  Completed:     { label: 'Completed',   bgClass: 'bg-[#F0FDF4]', textClass: 'text-[#16A34A]' },
  Cancelled:     { label: 'Cancelled',   bgClass: 'bg-[#F1F3F5]', textClass: 'text-[#6B7280]' },
  // BillStatus
  Unscheduled:   { label: 'Unscheduled', bgClass: 'bg-[#EFF6FF]', textClass: 'text-[#2563EB]' },
  Scheduled:     { label: 'Scheduled',   bgClass: 'bg-[#FFFBEB]', textClass: 'text-[#D97706]' },
  'In Transit':  { label: 'In Transit',  bgClass: 'bg-[#EEF5FF]', textClass: 'text-[#7C93C3]' },
  Delivered:     { label: 'Delivered',   bgClass: 'bg-[#F0FDF4]', textClass: 'text-[#16A34A]' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StatusBadge', () => {
  (Object.entries(STATUS_EXPECTATIONS) as [StatusValue, ExpectedConfig][]).forEach(
    ([status, { label, bgClass, textClass }]) => {
      describe(`status="${status}"`, () => {
        it('renders the correct label text', () => {
          render(<StatusBadge status={status} />);
          expect(screen.getByText(label)).toBeInTheDocument();
        });

        it('has role="status"', () => {
          render(<StatusBadge status={status} />);
          expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('has aria-label equal to the label text', () => {
          render(<StatusBadge status={status} />);
          expect(screen.getByRole('status')).toHaveAttribute('aria-label', label);
        });

        it('renders an icon with aria-hidden="true"', () => {
          const { container } = render(<StatusBadge status={status} />);
          // lucide-react icons render as <svg> elements
          const icon = container.querySelector('svg[aria-hidden="true"]');
          expect(icon).not.toBeNull();
        });

        it('applies the correct background color class', () => {
          render(<StatusBadge status={status} />);
          expect(screen.getByRole('status')).toHaveClass(bgClass);
        });

        it('applies the correct text color class', () => {
          render(<StatusBadge status={status} />);
          expect(screen.getByRole('status')).toHaveClass(textClass);
        });
      });
    },
  );
});
