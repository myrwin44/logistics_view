/**
 * TripDetailPanel — expandable detail panel for a selected trip row.
 */
import * as React from 'react';
import { MapPin, X } from 'lucide-react';
import { transportTripService } from '@/services/transportTripService';
import type { TripDetail, BillLeg } from '@/types/transportTrip';
import { cn } from '@/lib/cn';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatDateTimeShort, formatMinutes, stripWarehousePrefix, formatWeight } from '@/lib/format';

export interface TripDetailPanelProps {
  tripId: string;
  onClose: () => void;
}

export function TripDetailPanel({ tripId, onClose }: TripDetailPanelProps) {
  const [detail,       setDetail]       = React.useState<TripDetail | null>(null);
  const [bills,        setBills]        = React.useState<BillLeg[]>([]);
  const [totalBills,   setTotalBills]   = React.useState(0);
  const [billPage,     setBillPage]     = React.useState(0);
  const [billPageSize, setBillPageSize] = React.useState(50);

  const [loadingDetail, setLoadingDetail] = React.useState(true);
  const [loadingBills,  setLoadingBills]  = React.useState(true);
  const [errorDetail,   setErrorDetail]   = React.useState<string | null>(null);
  const [errorBills,    setErrorBills]    = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingDetail(true); setErrorDetail(null); setDetail(null);
    transportTripService.getTripDetail(tripId)
      .then(res => {
        if (cancelled) return;
        if (res.success && res.data) setDetail(res.data);
        else setErrorDetail(res.message ?? 'Lỗi không xác định');
      })
      .catch(e => { if (!cancelled) setErrorDetail(e?.message ?? 'Lỗi kết nối'); })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [tripId]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingBills(true); setErrorBills(null);
    transportTripService.getBillLegs(tripId, billPage)
      .then(res => {
        if (cancelled) return;
        setBills(res.data ?? []);
        setTotalBills(res.totalElements ?? 0);
        if (res.limit && res.limit > 0) setBillPageSize(res.limit);
      })
      .catch(e => { if (!cancelled) setErrorBills(e?.message ?? 'Lỗi kết nối'); })
      .finally(() => { if (!cancelled) setLoadingBills(false); });
    return () => { cancelled = true; };
  }, [tripId, billPage]);

  const totalBillPages = billPageSize > 0 ? Math.ceil(totalBills / billPageSize) : 1;
  const ov = detail?.tripOverview;

  return (
    <div className="border-t-2 border-primary bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-blue-50 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-slate-800 font-mono shrink-0">{tripId}</span>
        </div>
        <button onClick={onClose}
          className="ml-3 shrink-0 p-1 rounded hover:bg-slate-200 transition-colors" aria-label="Đóng">
          <X size={14} className="text-slate-500" />
        </button>
      </div>

      {loadingDetail && <LoadingState variant="inline" />}

      {!loadingDetail && errorDetail && (
        <ErrorState variant="inline" message={errorDetail} />
      )}

      {!loadingDetail && !errorDetail && ov && detail && (
        <div className="px-5 py-4 space-y-5">
          {/* Overview grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Biển số xe</div>
              <div className="text-sm font-bold text-slate-800">{ov.licensePlate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Số điểm dừng</div>
              <div className="text-sm font-semibold text-slate-700">{ov.noStops}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Số bills</div>
              <div className="text-sm font-semibold text-brand-mid">{ov.totalBill.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Tổng tải trọng</div>
              <div className="text-sm font-semibold text-slate-700">{formatWeight(ov.totalLoad)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Kho đầu</div>
              <div className="text-sm text-slate-700 flex items-center gap-1">
                <MapPin size={10} className="text-green-500 shrink-0" /> {stripWarehousePrefix(ov.originWarehouse)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Kho cuối</div>
              <div className="text-sm text-slate-700 flex items-center gap-1">
                <MapPin size={10} className="text-red-400 shrink-0" /> {stripWarehousePrefix(ov.destinationWarehouse)}
              </div>
            </div>
          </div>

          {/* Stop overviews */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Lịch trình điểm dừng
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { label: 'STT',          cls: 'text-left' },
                      { label: 'Checkin',      cls: 'text-left' },
                      { label: 'Checkout',     cls: 'text-left' },
                      { label: 'Thời gian',    cls: 'text-center' },
                      { label: '↑ Lên (kg)',   cls: 'text-right' },
                      { label: '↓ Xuống (kg)', cls: 'text-right' },
                      { label: 'Đến kho sau',  cls: 'text-right' },
                    ].map(h => (
                      <th key={h.label}
                        className={`py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h.cls}`}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.tripStopOverviews.map((s, i) => (
                    <tr key={s.seq_no}
                      className={cn('border-b border-slate-100', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                      <td className="py-2 px-3 font-mono text-slate-500">{s.seq_no}</td>
                      <td className="py-2 px-3 tabular-nums text-slate-600 whitespace-nowrap">{formatDateTimeShort(s.check_in)}</td>
                      <td className="py-2 px-3 tabular-nums text-slate-600 whitespace-nowrap">{formatDateTimeShort(s.check_out)}</td>
                      <td className="py-2 px-3 tabular-nums text-center text-slate-500">{formatMinutes(s.totalTime)}</td>
                      <td className="py-2 px-3 tabular-nums text-right">
                        {s.uploadWeight > 0
                          ? <span className="font-semibold text-brand-mid">{formatWeight(s.uploadWeight)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2 px-3 tabular-nums text-right">
                        {s.downloadWeight > 0
                          ? <span className="font-semibold text-red-500">{formatWeight(s.downloadWeight)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2 px-3 tabular-nums text-right text-slate-400">
                        {s.distance > 0 ? `${s.distance.toLocaleString('vi-VN')} km` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill legs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Bills trên chuyến
                {totalBills > 0 && (
                  <span className="ml-2 text-[10px] text-slate-400 normal-case font-normal">
                    (Hiển thị {bills.length}/{totalBills})
                  </span>
                )}
              </h3>
              {totalBillPages > 1 && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    disabled={billPage === 0}
                    onClick={() => setBillPage(p => p - 1)}
                    className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    ‹ Trước
                  </button>
                  <span className="text-slate-500 font-medium tabular-nums">
                    {billPage + 1}/{totalBillPages}
                  </span>
                  <button
                    disabled={billPage + 1 >= totalBillPages}
                    onClick={() => setBillPage(p => p + 1)}
                    className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    Sau ›
                  </button>
                </div>
              )}
            </div>

            {loadingBills && <LoadingState variant="small" />}

            {!loadingBills && errorBills && (
              <ErrorState variant="inline" message={errorBills} className="text-xs" />
            )}

            {!loadingBills && !errorBills && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {[
                        { label: 'Mã bill',     cls: 'text-left' },
                        { label: 'Từ kho',      cls: 'text-center' },
                        { label: 'Đến kho',     cls: 'text-center' },
                        { label: 'KL (kg)',     cls: 'text-center' },
                        { label: 'Lên hàng',   cls: 'text-center' },
                        { label: 'Xuống hàng', cls: 'text-center' },
                      ].map(h => (
                        <th key={h.label}
                          className={`py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h.cls}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b, i) => (
                      <tr key={b.billId}
                        className={cn('border-b border-slate-100', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                        <td className="py-1.5 px-3 font-mono text-brand-mid text-[11px]">{b.billId}</td>
                        <td className="py-1.5 px-3 text-slate-600 text-center">{stripWarehousePrefix(b.originWarehouse)}</td>
                        <td className="py-1.5 px-3 text-slate-600 text-center">{stripWarehousePrefix(b.destinationWarehouse)}</td>
                        <td className="py-1.5 px-3 tabular-nums text-center text-slate-700 font-medium">{formatWeight(b.actualWeight)}</td>
                        <td className="py-1.5 px-3 tabular-nums text-center text-slate-500 whitespace-nowrap">{formatDateTimeShort(b.uploadAt)}</td>
                        <td className="py-1.5 px-3 tabular-nums text-center text-slate-500 whitespace-nowrap">{formatDateTimeShort(b.downloadAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
