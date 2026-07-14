/**
 * BillColumns — column definitions for the Bills of Lading table.
 */

import type { ColumnDef } from '@tanstack/react-table';

import { StatusBadge } from '@/components/shared/StatusBadge';
import type { BillListItem } from '@/types/billOfLading';

export function buildBillColumns(): ColumnDef<BillListItem>[] {
  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'Bill ID',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.id}</span>
      ),
    },
    {
      id: 'originWarehouse',
      accessorKey: 'originWarehouse',
      header: 'Origin',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.originWarehouse}</span>
      ),
    },
    {
      id: 'destinationWarehouse',
      accessorKey: 'destinationWarehouse',
      header: 'Destination',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.destinationWarehouse}</span>
      ),
    },
    {
      id: 'weightKg',
      accessorKey: 'weightKg',
      header: 'Weight (kg)',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">
          {row.original.weightKg.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'scheduledDate',
      accessorKey: 'scheduledDate',
      header: 'Scheduled Date',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">
          {row.original.scheduledDate ?? '—'}
        </span>
      ),
    },
  ];
}
