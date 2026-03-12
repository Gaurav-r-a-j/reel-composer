import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface ReplaceSceneDialogProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReplaceSceneDialog: React.FC<ReplaceSceneDialogProps> = ({
  show,
  onConfirm,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="replace-dialog-title">
      <div className="bg-surface border border-edge rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-success-muted text-success rounded-xl shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h3 id="replace-dialog-title" className="text-base font-semibold text-ink">Scene Generated</h3>
              <p className="text-xs text-ink-muted mt-0.5">The AI has finished generating your scene.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink transition-colors p-1 rounded-lg -m-1 focus-ring shrink-0" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink-muted mb-6 leading-relaxed">
          A new scene has arrived from the background generation process. Would you like to replace your current manual setup with the AI-generated one?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-surface-elevated hover:bg-edge text-ink-muted font-medium text-sm transition-colors border border-edge focus-ring"
          >
            Keep Manual
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors focus-ring"
          >
            Replace Scene
          </button>
        </div>
      </div>
    </div>
  );
};
