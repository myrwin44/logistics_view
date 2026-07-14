import { KPICard } from '@/components/shared/KPICard';
import type { DashboardData } from '@/types/dashboard';

interface KPISectionProps {
  data: DashboardData | null;
  isLoading: boolean;
}

/**
 * Renders a row of four KPI metric cards for the Dashboard page.
 * Passes `isLoading` to each card so they render skeleton placeholders
 * while data is being fetched.
 */
export function KPISection({ data, isLoading }: KPISectionProps) {
  // Convert kg → tấn (1 tấn = 1000 kg)
  const totalWeightTon = data
    ? +(data.common.totalLoads / 1000).toFixed(3)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        label="Tổng chuyến xe"
        value={data?.common.totalTrips.totalTrips ?? 0}
        isLoading={isLoading}
      />
      <KPICard
        label="Số xe (biển số)"
        value={data?.common.totalVehicles.totalVehicles ?? 0}
        isLoading={isLoading}
      />
      <KPICard
        label="Tổng bills hàng"
        value={data?.common.totalBills.totalBills ?? 0}
        isLoading={isLoading}
      />
      <KPICard
        label="Tổng tải"
        value={totalWeightTon}
        unit="tấn"
        isLoading={isLoading}
      />
    </div>
  );
}


