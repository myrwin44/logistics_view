/**
 * BillFilters — filter bar for the Bills of Lading page.
 */

import * as React from 'react';

import { warehouseService } from '@/services/warehouseService';
import type { BillStatus } from '@/types/billOfLading';
import type { Warehouse } from '@/types/warehouse';

export interface BillFiltersProps {
  options: BillStatus[];
  status: BillStatus | undefined;
  id: string | undefined;
  warehouseId: number | undefined;
  transportTripId: string | undefined;
  onApply: (filters: {
    status?: BillStatus;
    id?: string;
    warehouseId?: number;
    transportTripId?: string;
  }) => void;
  onClear: () => void;
}

export function BillFilters({
  options,
  status,
  id,
  warehouseId,
  transportTripId,
  onApply,
  onClear,
}: BillFiltersProps) {
  // ── Local uncommitted input state ─────────────────────────────────────────
  const [statusInput, setStatusInput] = React.useState<BillStatus | undefined>(status);
  const [idInput, setIdInput] = React.useState(id ?? '');
  const [warehouseIdInput, setWarehouseIdInput] = React.useState(warehouseId?.toString() ?? '');
  const [transportTripIdInput, setTransportTripIdInput] = React.useState(transportTripId ?? '');
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = React.useState(false);

  // Fetch warehouses on mount
  React.useEffect(() => {
    setIsLoadingWarehouses(true);
    warehouseService
      .getWarehouses('type:1A')
      .then((result) => {
        if (result.success) {
          setWarehouses(result.data);
        }
      })
      .finally(() => {
        setIsLoadingWarehouses(false);
      });
  }, []);

  // Sync local state with props when props change
  React.useEffect(() => {
    setStatusInput(status);
  }, [status]);

  React.useEffect(() => {
    setIdInput(id ?? '');
  }, [id]);

  React.useEffect(() => {
    setWarehouseIdInput(warehouseId?.toString() ?? '');
  }, [warehouseId]);

  React.useEffect(() => {
    setTransportTripIdInput(transportTripId ?? '');
  }, [transportTripId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleApply() {
    const parsedWarehouseId = warehouseIdInput.trim() ? parseInt(warehouseIdInput, 10) : undefined;

    onApply({
      status: statusInput,
      id: idInput.trim() || undefined,
      warehouseId: isNaN(parsedWarehouseId as number) ? undefined : parsedWarehouseId,
      transportTripId: transportTripIdInput.trim() || undefined,
    });
  }

  function handleClear() {
    setStatusInput(undefined);
    setIdInput('');
    setWarehouseIdInput('');
    setTransportTripIdInput('');
    onClear();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="bill-status" className="text-xs font-medium text-slate-600 whitespace-nowrap">
          Trạng thái
        </label>
        <select
          id="bill-status"
          value={statusInput ?? ''}
          onChange={(e) => setStatusInput(e.target.value as BillStatus | undefined)}
          className="h-8 w-32 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="bill-id" className="text-xs font-medium text-slate-600 whitespace-nowrap">
          Mã đơn
        </label>
        <input
          id="bill-id"
          type="text"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Mã đơn..."
          className="h-8 w-32 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="bill-warehouse" className="text-xs font-medium text-slate-600 whitespace-nowrap">
          Kho
        </label>
        <select
          id="bill-warehouse"
          value={warehouseIdInput}
          onChange={(e) => setWarehouseIdInput(e.target.value)}
          disabled={isLoadingWarehouses}
          className="h-8 w-40 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">All</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id.toString()}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="bill-transport-trip-id" className="text-xs font-medium text-slate-600 whitespace-nowrap">
          Mã chuyến
        </label>
        <input
          id="bill-transport-trip-id"
          type="text"
          value={transportTripIdInput}
          onChange={(e) => setTransportTripIdInput(e.target.value)}
          placeholder="Mã chuyến..."
          className="h-8 w-32 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <button
        onClick={handleApply}
        className="h-8 px-4 text-xs font-semibold rounded-md bg-[#FFBF00] text-[#283F24] hover:bg-[#e6ac00] transition-colors"
      >
        Tìm
      </button>
      <button
        onClick={handleClear}
        className="h-8 px-3 text-xs font-medium rounded-md border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
      >
        Xóa
      </button>
    </div>
  );
}
