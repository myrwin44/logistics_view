import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from '@/components/layout/Breadcrumb';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumb', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Transport Trips', href: '/transport-trips' },
    { label: 'Trip #42' },
  ];

  it('renders a <nav> with aria-label="Breadcrumb"', () => {
    renderWithRouter(<Breadcrumb items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders an <ol> inside the nav', () => {
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    expect(container.querySelector('nav > ol')).toBeInTheDocument();
  });

  it('renders one <li> per item', () => {
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    expect(container.querySelectorAll('li')).toHaveLength(items.length);
  });

  it('renders items with href as <a> links', () => {
    renderWithRouter(<Breadcrumb items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Transport Trips' })).toBeInTheDocument();
  });

  it('renders the last item as a <span> with aria-current="page"', () => {
    renderWithRouter(<Breadcrumb items={items} />);
    const current = screen.getByText('Trip #42');
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('does not render the last item as a link', () => {
    renderWithRouter(<Breadcrumb items={items} />);
    // There should be exactly 2 links (Home + Transport Trips), not 3
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders separators between items with aria-hidden="true"', () => {
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    const separators = container.querySelectorAll('svg[aria-hidden="true"]');
    // N items → N-1 separators
    expect(separators).toHaveLength(items.length - 1);
  });

  it('renders correctly with a single item (no separator, no link)', () => {
    renderWithRouter(<Breadcrumb items={[{ label: 'Dashboard' }]} />);
    expect(screen.getByText('Dashboard')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const { container } = renderWithRouter(<Breadcrumb items={[{ label: 'Dashboard' }]} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('renders all item labels', () => {
    renderWithRouter(<Breadcrumb items={items} />);
    items.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
