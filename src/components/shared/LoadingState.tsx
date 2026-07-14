import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  variant: 'full' | 'inline' | 'small';
  message?: string;
}

const VARIANT_CONFIG = {
  full: {
    container: 'flex justify-center items-center gap-2 py-12',
    spinnerSize: 16,
    textClass: 'text-sm text-slate-400',
    defaultMessage: 'Đang tải dữ liệu...',
  },
  inline: {
    container: 'flex justify-center items-center gap-2 py-8',
    spinnerSize: 15,
    textClass: 'text-sm text-slate-400',
    defaultMessage: 'Đang tải chi tiết...',
  },
  small: {
    container: 'flex justify-center items-center gap-2 py-5',
    spinnerSize: 12,
    textClass: 'text-xs text-slate-400',
    defaultMessage: 'Đang tải bills...',
  },
} as const;

export function LoadingState({ variant, message }: LoadingStateProps) {
  const config = VARIANT_CONFIG[variant];
  const displayMessage = message ?? config.defaultMessage;

  return (
    <div className={config.container}>
      <Loader2 size={config.spinnerSize} className="animate-spin text-primary" />
      <span className={config.textClass}>{displayMessage}</span>
    </div>
  );
}
