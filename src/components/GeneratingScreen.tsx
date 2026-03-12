import React from 'react';
import { LayoutTemplate, AlertCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
          <Label htmlFor="topic-context">
            Video Topic / Visual Context <span className="normal-case">(Optional)</span>
          </Label>
          <Textarea
            id="topic-context"
            value={topicContext}
            onChange={(e) => onTopicContextChange(e.target.value)}
            placeholder={isAudioOnly ? "e.g. Visuals should be about space exploration, with planets and stars." : "e.g. This video explains Quantum Tunneling. I want particles passing through barriers..."}
            className="w-full min-h-28 resize-none"
          />
        </div>

        <div className="w-full space-y-3">
          <Button onClick={onEnterStudio} disabled={isGenerating} className="w-full h-auto py-3.5 gap-2">
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
          </Button>

          {isGenerating && showManualButton && (
            <div className="animate-fade-in text-center pt-1">
              <span className="text-xs text-ink-subtle block mb-2">Taking longer than expected?</span>
              <Button variant="link" size="sm" onClick={onManualModeEnter} className="h-auto p-0">
                Skip & Enter Manual Mode
              </Button>
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
              <Button variant="outline" size="sm" onClick={onResetAuth}>
                Update API Key
              </Button>
              <Button variant="outline" size="sm" onClick={onManualModeEnter}>
                Continue in Manual Mode
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
