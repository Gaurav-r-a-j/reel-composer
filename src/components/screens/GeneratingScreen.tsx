import React from 'react';
import { LayoutTemplate, AlertCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/layout/ModeToggle';

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
    <div className="flex flex-col h-full overflow-auto bg-background relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full animate-fade-in">
        <div className="container py-6 w-full flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-3 px-6 pt-6 pb-4">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <LayoutTemplate size={28} />
            </div>
            <CardTitle>Director's Studio</CardTitle>
            <CardDescription className="mx-auto w-full text-base sm:max-w-md">
              {isAudioOnly
                ? "Audio-Only Mode: We will generate full-screen visuals to accompany your script."
                : "Describe your video topic. We'll copy this prompt to your clipboard and auto-generate the initial animation scene."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-2 pb-6 space-y-6">
            <section aria-labelledby="topic-label">
              <Label id="topic-label" htmlFor="topic-context" className="text-foreground font-medium">
                Video Topic / Visual Context <span className="normal-case font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="topic-context"
                value={topicContext}
                onChange={(e) => onTopicContextChange(e.target.value)}
                placeholder={isAudioOnly ? "e.g. Visuals should be about space exploration, with planets and stars." : "e.g. This video explains Quantum Tunneling. I want particles passing through barriers..."}
                className="w-full min-h-28 resize-none mt-3"
              />
            </section>

            <section aria-label="Actions">
              <div className="space-y-4">
              <Button onClick={onEnterStudio} disabled={isGenerating} className="w-full gap-2" size="lg">
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin shrink-0" />
                    Generating Scene...
                  </>
                ) : (
                  <>
                    <Edit3 size={18} className="shrink-0" />
                    {!apiKey ? "No API Key - Enter Manual Mode" : (srtDataLength === 0 ? "Enter Demo Studio" : "Enter Studio & Auto-Generate")}
                  </>
                )}
              </Button>

              {isGenerating && showManualButton && (
                <div className="animate-fade-in text-center">
                  <p className="text-sm text-muted-foreground block mb-2">Taking longer than expected?</p>
                  <Button variant="link" size="sm" onClick={onManualModeEnter}>
                    Skip & Enter Manual Mode
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/40 rounded-xl flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-destructive">Generation Failed</h4>
                      <p className="text-sm text-destructive/90 mt-1 leading-relaxed">{error}</p>
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
            </section>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};
