import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export type SnackbarVariant = 'success' | 'error';

interface SnackbarProps {
  show: boolean;
  message: string;
  variant?: SnackbarVariant;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  show,
  message,
  variant = 'success',
}) => {
  const isError = variant === 'error';
  return (
    <div
      role="status"
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-medium shadow-lg z-[100] transition-all duration-300 flex items-center gap-3 min-w-[280px] max-w-[90vw] ${
        isError
          ? 'bg-destructive/95 text-destructive-foreground border border-destructive'
          : 'bg-card border border-border text-card-foreground'
      } ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
    >
      {isError ? (
        <AlertCircle size={20} className="shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 size={20} className="text-primary shrink-0" aria-hidden />
      )}
      <span className="flex-1">{message}</span>
    </div>
  );
};
