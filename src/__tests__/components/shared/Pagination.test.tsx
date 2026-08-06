import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../../../components/shared/Pagination';

describe('components/shared/Pagination - Component Tests', () => {
  it('should render nav with role="navigation"', () => {
    render(<Pagination currentPage={0} totalPages={5} onPageChange={vi.fn()} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Pagination');
  });

  it('should display "page X of Y" with 1-indexed currentPage', () => {
    render(<Pagination currentPage={2} totalPages={10} onPageChange={vi.fn()} />);
    
    expect(screen.getByText('page 3 of 10')).toBeInTheDocument();
  });

  it('should disable First and Previous buttons when currentPage is 0', () => {
    render(<Pagination currentPage={0} totalPages={5} onPageChange={vi.fn()} />);
    
    const firstBtn = screen.getByRole('button', { name: 'First page' });
    const prevBtn = screen.getByRole('button', { name: 'Previous page' });
    
    expect(firstBtn).toBeDisabled();
    expect(prevBtn).toBeDisabled();
  });

  it('should disable Next and Last buttons when currentPage is totalPages - 1', () => {
    render(<Pagination currentPage={4} totalPages={5} onPageChange={vi.fn()} />);
    
    const nextBtn = screen.getByRole('button', { name: 'Next page' });
    const lastBtn = screen.getByRole('button', { name: 'Last page' });
    
    expect(nextBtn).toBeDisabled();
    expect(lastBtn).toBeDisabled();
  });

  it('should call onPageChange with currentPage + 1 when Next clicked', async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />);
    
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange with currentPage - 1 when Previous clicked', async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />);
    
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange with 0 when First clicked', async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={handlePageChange} />);
    
    await user.click(screen.getByRole('button', { name: 'First page' }));
    
    expect(handlePageChange).toHaveBeenCalledWith(0);
  });

  it('should call onPageChange with totalPages - 1 when Last clicked', async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={0} totalPages={5} onPageChange={handlePageChange} />);
    
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });
});
