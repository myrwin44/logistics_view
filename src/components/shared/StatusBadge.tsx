import { Clock, Truck, CheckCircle2, XCircle, CalendarCheck, PackageCheck } from 'lucide-react';
import type { TripStatus } from '../../types/transportTrip';
import type { BillStatus } from '../../types/billOfLading';

type StatusValue = TripStatus | BillStatus;

interface StatusConfig {
  bgClass: string;
  textClass: string;
  icon: React.ElementType;
  label: string;
}

const STATUS_MAP: Record<StatusValue, StatusConfig> = {
  // TripStatus
  Pending: {
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    icon: Clock,
    label: 'Pending',
  },
  'In Progress': {
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    icon: Truck,
    label: 'In Progress',
  },
  Completed: {
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
    icon: CheckCircle2,
    label: 'Completed',
  },
  Cancelled: {
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-500',
    icon: XCircle,
    label: 'Cancelled',
  },
  // BillStatus
  Unscheduled: {
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    icon: Clock,
    label: 'Unscheduled',
  },
  Scheduled: {
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    icon: CalendarCheck,
    label: 'Scheduled',
  },
  'In Transit': {
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-400',
    icon: Truck,
    label: 'In Transit',
  },
  Delivered: {
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
    icon: PackageCheck,
    label: 'Delivered',
  },
};

interface StatusBadgeProps {
  status: StatusValue | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status as StatusValue];

  // Fallback nếu status không khớp
  if (!config) {
    return (
      <span
        role="status"
        aria-label={status}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
      >
        <span>{status}</span>
      </span>
    );
  }

  const { bgClass, textClass, icon: Icon, label } = config;

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${textClass}`}
    >
      <Icon size={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
