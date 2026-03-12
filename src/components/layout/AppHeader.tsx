import React from 'react';
import { Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/layout/ModeToggle';

interface AppHeaderProps {
  onResetAuth: () => void;
  onNewProject: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onResetAuth, onNewProject }) => {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-background/80 backdrop-blur-md z-10 shrink-0">
      <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Reel Composer
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <ModeToggle />
        <div className="w-px h-4 bg-border" aria-hidden />
        <Button variant="ghost" size="sm" onClick={onResetAuth} title="Reset API Key" className="gap-2 -mx-2">
          <Key size={16} />
          <span className="hidden lg:inline">Change Key</span>
        </Button>
        <div className="w-px h-4 bg-border" aria-hidden />
        <Button variant="ghost" size="sm" onClick={onNewProject} className="-mx-2">
          New Project
        </Button>
        <div className="w-px h-4 bg-border" aria-hidden />
        <span className="text-[10px] uppercase tracking-widest text-primary font-medium">v1.3</span>
      </div>
    </header>
  );
};
