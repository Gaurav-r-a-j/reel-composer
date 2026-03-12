import React from 'react';
import { Key } from 'lucide-react';

interface AppHeaderProps {
  onResetAuth: () => void;
  onNewProject: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onResetAuth, onNewProject }) => {
  return (
    <header className="h-14 border-b border-edge flex items-center justify-between px-5 bg-surface/80 backdrop-blur-md z-10 shrink-0">
      <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-secondary">
        Reel Composer
      </div>
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <button
          onClick={onResetAuth}
          className="flex items-center gap-2 hover:text-ink transition-colors rounded-md px-2 py-1.5 -mx-2"
          title="Reset API Key"
        >
          <Key size={16} />
          <span className="hidden lg:inline">Change Key</span>
        </button>
        <div className="w-px h-4 bg-edge" aria-hidden />
        <button
          onClick={onNewProject}
          className="hover:text-ink transition-colors rounded-md px-2 py-1.5 -mx-2"
        >
          New Project
        </button>
        <div className="w-px h-4 bg-edge" aria-hidden />
        <span className="text-[10px] uppercase tracking-widest text-accent font-medium">v1.3</span>
      </div>
    </header>
  );
};
