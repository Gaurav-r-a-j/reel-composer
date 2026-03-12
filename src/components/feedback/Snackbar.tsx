import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SnackbarProps {
  show: boolean;
  message: string;
}

export const Snackbar: React.FC<SnackbarProps> = ({ show, message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border text-card-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg z-[100] transition-all duration-300 flex items-center gap-2 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
    >
      <CheckCircle2 size={18} className="text-primary shrink-0" />
      <span>{message}</span>
    </div>
  );
};
