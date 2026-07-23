import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from './SkeletonTable';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading: boolean;
  /** Number of skeleton rows shown while loading. Defaults to 25. */
  skeletonRows?: number;
  /** Rendered when data is empty and not loading. */
  emptyState?: React.ReactNode;
  /** Called when a data row is clicked or activated via keyboard. */
  onRowClick?: (row: TData) => void;
  // Sort state driven by URL params (controlled externally)
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  /**
   * Called when the user clicks a sortable column header.
   * The sort cycle is: undefined → 'asc' → 'desc' → undefined
   */
  onSortChange?: (field: string, dir: 'asc' | 'desc' | undefined) => void;
}

// ---------------------------------------------------------------------------
// Sort cycling helper
// ---------------------------------------------------------------------------

/**
 * Returns the next sort direction for a given column following the 3-state cycle:
 *   undefined  →  'asc'  →  'desc'  →  undefined
 *
 * When clicking a different column the cycle resets from undefined.
 */
function nextSortDir(
  clickedField: string,
  currentField: string | undefined,
  currentDir: 'asc' | 'desc' | undefined,
): 'asc' | 'desc' | undefined {
  // Different column → start fresh at 'asc'
  if (clickedField !== currentField) return 'asc';
  // Same column → advance the cycle
  if (currentDir === undefined) return 'asc';
  if (currentDir === 'asc') return 'desc';
  return undefined; // 'desc' → reset
}

// ---------------------------------------------------------------------------
// aria-sort value helper
// ---------------------------------------------------------------------------

function toAriaSortValue(
  field: string,
  sortField: string | undefined,
  sortDir: 'asc' | 'desc' | undefined,
): React.AriaAttributes['aria-sort'] {
  if (field !== sortField || sortDir === undefined) return 'none';
  return sortDir === 'asc' ? 'ascending' : 'descending';
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

/**
 * Generic data table built on TanStack Table (getCoreRowModel) and
 * shadcn/ui Table primitives.
 *
 * Sort state is controlled externally via `sortField` / `sortDir` /
 * `onSortChange` (typically backed by URL search params).
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading,
  skeletonRows = 25,
  emptyState,
  onRowClick,
  sortField,
  sortDir,
  onSortChange,
}: DataTableProps<TData>) {
  // TanStack Table instance (core model only — no built-in sorting because
  // sort is controlled externally / server-side).
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Disable internal sort state management
    manualSorting: true,
  });

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (isLoading) {
    return (
      <SkeletonTable
        rows={skeletonRows}
        columns={columns.length}
      />
    );
  }

  // ------------------------------------------------------------------
  // Empty state
  // ------------------------------------------------------------------
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // ------------------------------------------------------------------
  // Render table
  // ------------------------------------------------------------------
  return (
    <Table>
      {/* ---- Header ---- */}
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              // A column is sortable when it has an `id` (or `accessorKey`)
              // and `onSortChange` is provided. Columns can opt-out by setting
              // `enableSorting: false` in their ColumnDef.
              const isSortable =
                onSortChange !== undefined &&
                header.column.getCanSort() !== false &&
                header.column.columnDef.enableSorting !== false;

              const colId = header.column.id;
              const ariaSortVal = isSortable
                ? toAriaSortValue(colId, sortField, sortDir)
                : undefined;

              const isActiveSort = isSortable && colId === sortField;

              function handleSortClick() {
                if (!isSortable || !onSortChange) return;
                const next = nextSortDir(colId, sortField, sortDir);
                onSortChange(colId, next);
              }

              function handleSortKeyDown(e: React.KeyboardEvent) {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSortClick();
                }
              }

              return (
                <TableHead
                  key={header.id}
                  aria-sort={ariaSortVal}
                >
                  {header.isPlaceholder ? null : isSortable ? (
                    // Sortable column — render a button inside <th>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide',
                        'hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm',
                        isActiveSort ? 'text-brand-dark' : 'text-ink-muted',
                      )}
                      onClick={handleSortClick}
                      onKeyDown={handleSortKeyDown}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {/* Sort direction indicator icon */}
                      {isActiveSort && sortDir === 'asc' ? (
                        <ChevronUp size={14} aria-hidden="true" />
                      ) : isActiveSort && sortDir === 'desc' ? (
                        <ChevronDown size={14} aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown
                          size={14}
                          aria-hidden="true"
                          className="opacity-40"
                        />
                      )}
                    </button>
                  ) : (
                    // Non-sortable column — plain render
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>

      {/* ---- Body ---- */}
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          // Fallback when emptyState prop is not provided
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center text-ink-muted py-10"
            >
              No data available.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, index) => {
            const isClickable = !!onRowClick;

            function handleRowClick() {
              onRowClick?.(row.original);
            }

            function handleRowKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
              if (e.key === 'Enter') {
                e.preventDefault();
                onRowClick?.(row.original);
              }
            }

            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                // Keyboard / click interaction
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? handleRowClick : undefined}
                onKeyDown={isClickable ? handleRowKeyDown : undefined}
                className={cn(
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-100',
                  isClickable &&
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                )}
                // ARIA role: 'button' would be semantically more correct for
                // clickable rows but breaks table semantics; we keep the row
                // as a tr and rely on tabIndex + keyboard handler.
                aria-label={
                  isClickable ? 'View row details' : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
