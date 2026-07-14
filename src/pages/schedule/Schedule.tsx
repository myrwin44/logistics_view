/**
 * ScheduleGeneratePage — sub-page for external-model-driven schedule generation.
 */

import { CalendarRange } from 'lucide-react';
import { useSchedule } from '@/hooks/useSchedule';
import { ScheduleForm } from './ScheduleForm';
import { ScheduleResults } from './ScheduleResults';
import type { ScheduleRequest } from '@/types/schedule';

export default function Schedule() {
  const { scheduleRun, isLoading, generate, reset } = useSchedule();

  function handleGenerate(startDate: string, endDate: string) {
    const request: ScheduleRequest = { startDate, endDate };
    generate(request);
  }

  function handleRetry() {
    reset();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header ── */}
      <header className="flex items-center gap-2">
        <CalendarRange size={16} className="text-[#FFBF00] shrink-0" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-[#111827]">Lập lịch vận chuyển</h1>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-[#6B7280]">Tạo lịch tự động theo khoảng thời gian</span>
      </header>

      {/* Schedule form — period selection + generate action */}
      <section aria-labelledby="schedule-form-heading">
        <h2 id="schedule-form-heading" className="sr-only">
          Scheduling Period
        </h2>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
          <ScheduleForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
      </section>

      {/* Schedule results — visible once a run completes */}
      <ScheduleResults scheduleRun={scheduleRun} onRetry={handleRetry} />
    </div>
  );
}

