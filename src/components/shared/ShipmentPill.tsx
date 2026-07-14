import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export interface ShipmentPillProps {
  billId: string;
  action: 'load' | 'unload';
}

/**
 * ShipmentPill displays a load or unload action badge for a bill of lading.
 * The action is conveyed by both icon AND text label — never by color or icon alone.
 */
export function ShipmentPill({ billId, action }: ShipmentPillProps) {
  const isLoad = action === 'load';

  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-400 rounded-full px-2 py-0.5 text-xs font-mono">
      {isLoad ? (
        <ArrowDownToLine size={12} aria-hidden="true" />
      ) : (
        <ArrowUpFromLine size={12} aria-hidden="true" />
      )}
      <span>{isLoad ? 'Load' : 'Unload'}</span>
      <span>{billId}</span>
    </span>
  );
}
