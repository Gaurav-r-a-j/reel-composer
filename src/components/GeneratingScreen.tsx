import React from 'react';
import { LayoutTemplate, AlertCircle, Edit3 } from 'lucide-react';

interface GeneratingScreenProps {
  isAudioOnly: boolean;
  topicContext: string;
  onTopicContextChange: (text: string) => void;
  isGenerating: boolean;
  showManualButton: boolean;
  error: string | null;
  onEnterStudio: () => void;
  onManualModeEnter: () => void;
  onResetAuth: () => void;
  apiKey: string;
  srtDataLength: number;
}

export const GeneratingScreen: React.FC<GeneratingScreenProps> = ({
  isAudioOnly,
  topicContext,
  onTopicContextChange,
  isGenerating,
  showManualButton,
  error,
  onEnterStudio,
  onManualModeEnter,
  onResetAuth,
  apiKey,
  srtDataLength
}) => {
  return (
    <div className="flex flex-col h-full overflow-auto bg-page">
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-accent-muted rounded-2xl flex items-center justify-center text-accent mb-3">
            <LayoutTemplate size={28} />
          </div>
          <h2 className="text-2xl font-bold text-ink">Director's Studio</h2>
          <p className="text-ink-muted text-sm max-w-md mx-auto leading-relaxed">
            {isAudioOnly
              ? "Audio-Only Mode: We will generate full-screen visuals to accompany your script."
              : "Describe your video topic. We'll copy this prompt to your clipboard and auto-generate the initial animation scene."}
          </p>
        </div>

        <div className="w-full space-y-3">
          <label htmlFor="topic-context" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
            Video Topic / Visual Context <span className="text-ink-subtle normal-case">(Optional)</span>
          </label>
          <textarea
            id="topic-context"
            value={topicContext}
            onChange={(e) => onTopicContextChange(e.target.value)}
            placeholder={isAudioOnly ? "e.g. Visuals should be about space exploration, with planets and stars." : "e.g. This video explains Quantum Tunneling. I want particles passing through barriers..."}
            className="w-full h-28 bg-surface border border-edge rounded-xl p-4 text-ink placeholder-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent/25 outline-none resize-none transition-all focus-ring"
          />
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={onEnterStudio}
            disabled={isGenerating}
            className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all focus-ring ${
              isGenerating
                ? 'bg-surface-elevated text-ink-subtle cursor-not-allowed'
                : 'bg-gradient-to-r from-accent to-accent-secondary hover:opacity-95 text-white shadow-lg hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Scene...
              </>
            ) : (
              <>
                <Edit3 size={18} />
                {!apiKey ? "No API Key - Enter Manual Mode" : (srtDataLength === 0 ? "Enter Demo Studio" : "Enter Studio & Auto-Generate")}
              </>
            )}
          </button>

          {isGenerating && showManualButton && (
            <div className="animate-fade-in text-center pt-1">
              <span className="text-xs text-ink-subtle block mb-2">Taking longer than expected?</span>
              <button
                onClick={onManualModeEnter}
                className="text-sm text-accent hover:text-ink underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors focus-ring rounded"
              >
                Skip & Enter Manual Mode
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="w-full p-4 bg-danger-muted border border-danger/30 rounded-xl flex flex-col gap-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-danger">Generation Failed</h4>
                <p className="text-xs text-danger/90 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex gap-3 pl-8 flex-wrap">
              <button
                onClick={onResetAuth}
                className="px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger text-xs font-medium rounded-lg transition-colors border border-danger/40 focus-ring"
              >
                Update API Key
              </button>
              <button
                onClick={onManualModeEnter}
                className="px-4 py-2 bg-surface-elevated hover:bg-edge text-ink-muted text-xs font-medium rounded-lg transition-colors border border-edge focus-ring"
              >
                Continue in Manual Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
