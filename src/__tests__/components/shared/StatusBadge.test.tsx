import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import type { TripStatus } from '../../../types/transportTrip';
import type { BillStatus } from '../../../types/billOfLading';

describe('components/shared/StatusBadge - Component Tests', () => {
  describe('TripStatus values', () => {
    const tripStatuses: TripStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

    tripStatuses.forEach((status) => {
      it(`should render role="status" and correct aria-label for "${status}"`, () => {
        render(<StatusBadge status={status} />);
        const badge = screen.getByRole('status');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('aria-label', status);
      });
    });
  });

  describe('BillStatus values', () => {
    const billStatuses: BillStatus[] = ['ESTIMATED', 'MODIFIED', 'ACTUAL'];

    billStatuses.forEach((status) => {
      it(`should render role="status" and correct aria-label for "${status}"`, () => {
        render(<StatusBadge status={status} />);
        const badge = screen.getByRole('status');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('aria-label', status);
      });
    });
  });

  describe('Unknown status fallback', () => {
    it('should render fallback with role="status" displaying the original status string', () => {
      render(<StatusBadge status="UNKNOWN_STATUS" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toContain('UNKNOWN_STATUS');
    });
  });

  describe('Specific case', () => {
    it('should render aria-label="Completed" for Completed status', () => {
      render(<StatusBadge status="Completed" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Completed');
    });
  });
});
