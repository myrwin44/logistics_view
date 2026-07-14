/**
 * Unit tests for src/components/shared/DataTable.tsx
 *
 * Covers:
 * - Sort cycling: clicking a sortable column header advances the
 *   undefined → 'asc' → 'desc' → undefined cycle and calls onSortChange
 * - Skeleton rows: isLoading=true renders skeleton UI, not data rows
 * - Empty state: data=[] with emptyState prop renders the emptyState node
 * - Row click: onRowClick called with correct row data; rows have tabIndex=0;
 *   Enter key on a row triggers the callback
 *
 * Requirements: 6.2, 12.1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/shared/DataTable';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

interface Person {
  id: number;
  name: string;
  age: number;
}

const testData: Person[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Carol', age: 35 },
];

const columns: ColumnDef<Person>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    id: 'age',
    accessorKey: 'age',
    header: 'Age',
    enableSorting: true,
  },
];

// ---------------------------------------------------------------------------
// Sort cycling
// ---------------------------------------------------------------------------

describe('DataTable — sort cycling', () => {
  it('calls onSortChange with "asc" when clicking a column with no current sort', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={onSortChange}
        sortField={undefined}
        sortDir={undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledOnce();
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('calls onSortChange with "asc" when clicking a different column than the active one', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={onSortChange}
        sortField="age"
        sortDir="asc"
      />,
    );

    // Click the "name" column (different from active "age")
    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('calls onSortChange with "desc" when the column is already sorted asc', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={onSortChange}
        sortField="name"
        sortDir="asc"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
  });

  it('calls onSortChange with undefined when the column is already sorted desc', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={onSortChange}
        sortField="name"
        sortDir="desc"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledWith('name', undefined);
  });

  it('sets aria-sort="ascending" on the active asc column', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={vi.fn()}
        sortField="name"
        sortDir="asc"
      />,
    );

    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sets aria-sort="descending" on the active desc column', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onSortChange={vi.fn()}
        sortField="name"
        sortDir="desc"
      />,
    );

    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });
});

// ---------------------------------------------------------------------------
// Skeleton rows (loading state)
// ---------------------------------------------------------------------------

describe('DataTable — skeleton loading state', () => {
  it('does not render data rows when isLoading is true', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={true}
        skeletonRows={5}
      />,
    );

    // None of the actual data values should be visible
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.queryByText('Bob')).toBeNull();
    expect(screen.queryByText('Carol')).toBeNull();
  });

  it('renders the correct number of skeleton rows', () => {
    const skeletonRows = 7;
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={true}
        skeletonRows={skeletonRows}
      />,
    );

    // SkeletonTable renders one <tr> per skeleton row inside <tbody>
    // plus one header row; count only tbody rows via their role
    const allRows = screen.getAllByRole('row');
    // Subtract 1 for the header row
    const bodyRows = allRows.length - 1;
    expect(bodyRows).toBe(skeletonRows);
  });

  it('defaults to 25 skeleton rows when skeletonRows prop is omitted', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={true}
      />,
    );

    const allRows = screen.getAllByRole('row');
    const bodyRows = allRows.length - 1;
    expect(bodyRows).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('DataTable — empty state', () => {
  it('renders the emptyState node when data is empty and not loading', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        emptyState={<p>No records found</p>}
      />,
    );

    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('does not render a table when data is empty and emptyState is provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        emptyState={<p>Empty</p>}
      />,
    );

    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders a "No data available" fallback when data is empty but no emptyState prop', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Row click
// ---------------------------------------------------------------------------

describe('DataTable — row click', () => {
  it('calls onRowClick with the correct row data when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onRowClick={onRowClick}
      />,
    );

    // Click the row containing "Alice"
    fireEvent.click(screen.getByText('Alice').closest('tr')!);
    expect(onRowClick).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('calls onRowClick with the correct data for each distinct row', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByText('Bob').closest('tr')!);
    expect(onRowClick).toHaveBeenCalledWith(testData[1]);
  });

  it('gives each data row tabIndex=0 when onRowClick is provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onRowClick={vi.fn()}
      />,
    );

    // All body rows (not the header) should have tabIndex 0
    const aliceRow = screen.getByText('Alice').closest('tr')!;
    expect(aliceRow).toHaveAttribute('tabindex', '0');

    const bobRow = screen.getByText('Bob').closest('tr')!;
    expect(bobRow).toHaveAttribute('tabindex', '0');
  });

  it('does not set tabIndex on rows when onRowClick is not provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
      />,
    );

    const aliceRow = screen.getByText('Alice').closest('tr')!;
    expect(aliceRow).not.toHaveAttribute('tabindex');
  });

  it('calls onRowClick when Enter is pressed on a row', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={testData}
        isLoading={false}
        onRowClick={onRowClick}
      />,
    );

    const aliceRow = screen.getByText('Alice').closest('tr')!;
    aliceRow.focus();
    await user.keyboard('{Enter}');

    expect(onRowClick).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });
});
