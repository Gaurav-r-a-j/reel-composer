import React from 'react';
import { Key, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/layout/ModeToggle';

interface AppHeaderProps {
  onResetAuth: () => void;
  onNewProject: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onResetAuth, onNewProject }) => {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm z-10">
      <div className="container flex items-center justify-between h-full gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 shrink-0 rounded-lg bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center">
            <Play className="size-4 text-white" />
          </div>
          <span className="font-semibold text-foreground truncate">Reel Composer</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <ModeToggle />
          <span className="w-px h-4 bg-border" aria-hidden />
          <Button variant="ghost" size="sm" onClick={onResetAuth} title="Reset API Key" className="gap-1.5 h-8 px-2 rounded-lg">
            <Key className="size-4" />
            <span className="hidden sm:inline">Change Key</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onNewProject} className="h-8 px-2 rounded-lg">
            New Project
          </Button>
          <span className="w-px h-4 bg-border" aria-hidden />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">v1.3</span>
        </div>
      </div>
    </header>
  );
};
