import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

export const MobileBlocker: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-page flex flex-col items-center justify-center p-8 text-center md:hidden">
      <div className="w-20 h-20 bg-accent-muted rounded-2xl border border-edge flex items-center justify-center mb-6 shadow-lg relative overflow-hidden">
        <Smartphone size={32} className="text-ink-muted relative z-10" />
      </div>
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-secondary mb-2">
        Desktop Experience Required
      </h2>
      <p className="text-ink-muted max-w-xs leading-relaxed text-sm">
        Reel Composer is a professional studio tool designed for larger screens.
        <br /><br />
        Please open this application on your <strong className="text-ink">Laptop</strong> or <strong className="text-ink">Desktop</strong>.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-ink-subtle uppercase tracking-widest">
        <Monitor size={14} />
        <span>Best viewed on 1024px+</span>
      </div>
    </div>
  );
};
