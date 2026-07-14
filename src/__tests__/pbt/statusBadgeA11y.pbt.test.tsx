/**
 * Property-Based Test: Status Badge Accessibility Completeness
 *
 * Feature: lgts-platform, Property 10: Status Badge Accessibility Completeness
 * Arbitrary: fc.constantFrom(...allTripStatuses, ...allBillStatuses) for status value
 * Render <StatusBadge status={s} />; assert presence of role="status", non-empty
 * aria-label, visible text label, and icon with aria-hidden="true" — for every
 * possible status.
 *
 * Validates: Requirements 13.3, 6.7, 9.4
 */

import { describe, it, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import type { TripStatus } from '@/types/transportTrip';
import type { BillStatus } from '@/types/billOfLading';
import { StatusBadge } from '@/components/shared/StatusBadge';

// ---------------------------------------------------------------------------
// All possible status values
// ---------------------------------------------------------------------------

const allTripStatuses: TripStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const allBillStatuses: BillStatus[] = ['Unscheduled', 'Scheduled', 'In Transit', 'Delivered'];

type StatusValue = TripStatus | BillStatus;

const allStatuses: StatusValue[] = [...allTripStatuses, ...allBillStatuses];

// ---------------------------------------------------------------------------
// Arbitrary
// ---------------------------------------------------------------------------

const arbitraryStatus = fc.constantFrom<StatusValue>(...allStatuses);

// ---------------------------------------------------------------------------
// Cleanup between runs
// ---------------------------------------------------------------------------

afterEach(() => {
  // No external state to clean up, but keep consistent with project conventions
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 10 — Status Badge Accessibility Completeness', () => {
  it(
    'renders with role="status" for every possible status value',
    () => {
      fc.assert(
        fc.property(arbitraryStatus, (status) => {
          const { unmount } = render(<StatusBadge status={status} />);

          const badge = screen.getByRole('status');
          const hasRoleStatus = badge !== null;

          unmount();
          return hasRoleStatus;
        }),
        { numRuns: allStatuses.length },
      );
    },
  );

  it(
    'renders a non-empty aria-label for every possible status value',
    () => {
      fc.assert(
        fc.property(arbitraryStatus, (status) => {
          const { unmount } = render(<StatusBadge status={status} />);

          const badge = screen.getByRole('status');
          const ariaLabel = badge.getAttribute('aria-label');
          const hasNonEmptyAriaLabel =
            ariaLabel !== null && ariaLabel.trim().length > 0;

          unmount();
          return hasNonEmptyAriaLabel;
        }),
        { numRuns: allStatuses.length },
      );
    },
  );

  it(
    'renders visible text label for every possible status value',
    () => {
      fc.assert(
        fc.property(arbitraryStatus, (status) => {
          const { unmount } = render(<StatusBadge status={status} />);

          // The visible text is rendered inside a <span> child of role="status"
          const badge = screen.getByRole('status');
          const textContent = badge.textContent?.trim() ?? '';
          const hasVisibleText = textContent.length > 0;

          unmount();
          return hasVisibleText;
        }),
        { numRuns: allStatuses.length },
      );
    },
  );

  it(
    'renders icon with aria-hidden="true" for every possible status value',
    () => {
      fc.assert(
        fc.property(arbitraryStatus, (status) => {
          const { unmount, container } = render(<StatusBadge status={status} />);

          // The icon is an SVG element rendered by lucide-react; it must have aria-hidden="true"
          const svgIcon = container.querySelector('svg');
          const hasAriaHiddenIcon =
            svgIcon !== null &&
            svgIcon.getAttribute('aria-hidden') === 'true';

          unmount();
          return hasAriaHiddenIcon;
        }),
        { numRuns: allStatuses.length },
      );
    },
  );

  it(
    'satisfies all accessibility requirements simultaneously for every possible status value',
    () => {
      fc.assert(
        fc.property(arbitraryStatus, (status) => {
          const { unmount, container } = render(<StatusBadge status={status} />);

          // 1. role="status" present
          const badge = screen.getByRole('status');
          const hasRoleStatus = badge !== null;

          // 2. non-empty aria-label
          const ariaLabel = badge.getAttribute('aria-label');
          const hasNonEmptyAriaLabel =
            ariaLabel !== null && ariaLabel.trim().length > 0;

          // 3. visible text label
          const textContent = badge.textContent?.trim() ?? '';
          const hasVisibleText = textContent.length > 0;

          // 4. icon with aria-hidden="true"
          const svgIcon = container.querySelector('svg');
          const hasAriaHiddenIcon =
            svgIcon !== null &&
            svgIcon.getAttribute('aria-hidden') === 'true';

          unmount();

          return (
            hasRoleStatus &&
            hasNonEmptyAriaLabel &&
            hasVisibleText &&
            hasAriaHiddenIcon
          );
        }),
        { numRuns: allStatuses.length },
      );
    },
  );
});
