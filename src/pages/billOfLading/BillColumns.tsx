/**
 * BillColumns — column definitions for the Bills of Lading table.
 */

import type { ColumnDef } from '@tanstack/react-table';

import type { BillListItem } from '@/types/billOfLading';
import { formatWeight } from '@/lib/format';

export function buildBillColumns(): ColumnDef<BillListItem>[] {
  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'Mã đơn',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.id}</span>
      ),
    },
    {
      id: 'originWarehouse',
      accessorKey: 'originWarehouse',
      header: 'Kho đầu',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.originWarehouse}</span>
      ),
    },
    {
      id: 'destinationWarehouse',
      accessorKey: 'destinationWarehouse',
      header: 'Kho cuối',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.destinationWarehouse}</span>
      ),
    },
    {
      id: 'transportTripId',
      accessorKey: 'transportTripId',
      header: 'Mã chuyến',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.transportTripId}</span>
      ),
    },
    {
      id: 'actualWeight',
      accessorKey: 'actualWeight',
      header: 'Khối lượng',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">
          {formatWeight(row.original.actualWeight)}
        </span>
      ),
    },
    {
      id: 'uploadAt',
      accessorKey: 'uploadAt',
      header: 'Ngày lên hàng',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">{row.original.uploadAt}</span>
      ),
    },
    {
      id: 'downloadAt',
      accessorKey: 'downloadAt',
      header: 'Ngày xuống hàng',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-ink">{row.original.downloadAt}</span>
      ),
    },
  ];
}
