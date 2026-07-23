/**
 * ScheduleForm — period selector and generate trigger for the Scheduling page.
 */

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface ScheduleFormProps {
  /** Called with ISO date strings when the form is valid and submitted. */
  onGenerate: (startDate: string, endDate: string) => void;
  /** When true, disables the button and shows a loading indicator. */
  isLoading: boolean;
}

interface FieldErrors {
  startDate?: string;
  endDate?: string;
}

/**
 * ScheduleForm renders two `<input type="date">` fields for the scheduling
 * period and a "Generate Schedule" button.
 */
export function ScheduleForm({ onGenerate, isLoading }: ScheduleFormProps) {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  /** Validate and return error map; empty object means valid. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!startDate) {
      errors.startDate = 'Cần nhập vào ngày bắt đầu';
    }

    if (!endDate) {
      errors.endDate = 'Cần nhập vào ngày kết thúc';
    } else if (startDate && endDate < startDate) {
      errors.endDate = 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu';
    }

    return errors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onGenerate(startDate, endDate);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Schedule generation form">
      <div className="flex flex-wrap items-end gap-4">
        {/* Start date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-start-date">Ngày bắt đầu</Label>
          <Input
            id="schedule-start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (fieldErrors.startDate) {
                setFieldErrors((prev) => ({ ...prev, startDate: undefined }));
              }
            }}
            disabled={isLoading}
            aria-describedby={fieldErrors.startDate ? 'schedule-start-date-error' : undefined}
            aria-invalid={!!fieldErrors.startDate}
            className="w-44"
          />
          {fieldErrors.startDate && (
            <p
              id="schedule-start-date-error"
              role="alert"
              className="text-xs text-red-600"
            >
              {fieldErrors.startDate}
            </p>
          )}
        </div>

        {/* End date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-end-date">Ngày kết thúc</Label>
          <Input
            id="schedule-end-date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (fieldErrors.endDate) {
                setFieldErrors((prev) => ({ ...prev, endDate: undefined }));
              }
            }}
            disabled={isLoading}
            aria-describedby={fieldErrors.endDate ? 'schedule-end-date-error' : undefined}
            aria-invalid={!!fieldErrors.endDate}
            className="w-44"
          />
          {fieldErrors.endDate && (
            <p
              id="schedule-end-date-error"
              role="alert"
              className="text-xs text-red-600"
            >
              {fieldErrors.endDate}
            </p>
          )}
        </div>

        {/* Generate button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="self-end"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Đang lập lịch...
            </>
          ) : (
            'Lập lịch'
          )}
        </Button>
      </div>
    </form>
  );
}

export default ScheduleForm;
