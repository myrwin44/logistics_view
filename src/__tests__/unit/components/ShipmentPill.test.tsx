import { render, screen } from '@testing-library/react';
import { ShipmentPill } from '@/components/shared/ShipmentPill';

describe('ShipmentPill', () => {
  describe('load action', () => {
    it('renders "Load" text label', () => {
      render(<ShipmentPill billId="BL-001" action="load" />);
      expect(screen.getByText('Load')).toBeInTheDocument();
    });

    it('renders the billId', () => {
      render(<ShipmentPill billId="BL-001" action="load" />);
      expect(screen.getByText('BL-001')).toBeInTheDocument();
    });

    it('renders an SVG icon with aria-hidden="true"', () => {
      const { container } = render(<ShipmentPill billId="BL-001" action="load" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('unload action', () => {
    it('renders "Unload" text label', () => {
      render(<ShipmentPill billId="BL-002" action="unload" />);
      expect(screen.getByText('Unload')).toBeInTheDocument();
    });

    it('renders the billId', () => {
      render(<ShipmentPill billId="BL-002" action="unload" />);
      expect(screen.getByText('BL-002')).toBeInTheDocument();
    });

    it('renders an SVG icon with aria-hidden="true"', () => {
      const { container } = render(<ShipmentPill billId="BL-002" action="unload" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('pill styling', () => {
    it('has the correct CSS classes', () => {
      const { container } = render(<ShipmentPill billId="BL-001" action="load" />);
      const pill = container.firstChild as HTMLElement;
      expect(pill).toHaveClass('bg-[#EEF5FF]');
      expect(pill).toHaveClass('text-[#7C93C3]');
      expect(pill).toHaveClass('font-mono');
    });
  });
});
