import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../../../components/shared/KPICard';
import type { KPISubItem } from '../../../components/shared/KPICard';

describe('components/shared/KPICard - Component Tests', () => {
  it('should render skeleton placeholder when isLoading is true', () => {
    render(<KPICard label="Test Label" value={100} isLoading={true} />);

    // Skeleton shown, actual label/value not rendered
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('should display label and value when isLoading is false', () => {
    render(<KPICard label="Total Trips" value={150} isLoading={false} />);

    // The CSS class is `uppercase` — DOM text remains original case
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display unit after value when unit prop provided', () => {
    render(<KPICard label="Weight" value={1250} unit="kg" isLoading={false} />);

    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('should display all subItems labels and values', () => {
    const subItems: KPISubItem[] = [
      { label: 'Company', value: 50, unit: 'trips' },
      { label: 'Rented', value: 30, unit: 'trips' },
    ];

    render(<KPICard label="Total" value={80} subItems={subItems} isLoading={false} />);

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Rented')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should format numeric values with toLocaleString', () => {
    render(<KPICard label="Large Number" value={123456} isLoading={false} />);

    expect(screen.getByText('123,456')).toBeInTheDocument();
  });

  it('should not render dl element when isLoading is false and no subItems', () => {
    const { container } = render(<KPICard label="Simple" value={100} isLoading={false} />);

    expect(container.querySelector('dl')).toBeNull();
  });

  it('should render skeleton regardless of subItems when isLoading is true', () => {
    const subItems: KPISubItem[] = [{ label: 'Item', value: 10 }];
    render(<KPICard label="Test" value={100} subItems={subItems} isLoading={true} />);

    expect(screen.queryByText('Item')).not.toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });
});
