import React from 'react';
import { LayoutTemplate, AlertCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TOPIC_TEMPLATES: { label: string; value: string }[] = [
  { label: 'Tech tutorial', value: 'Tech tutorial: clean code walkthrough, screen recordings, and simple diagrams. Modern UI and developer tools.' },
  { label: 'Product demo', value: 'Product demo: feature highlights, smooth transitions, and clear call-to-actions. Professional and polished.' },
  { label: 'Space & science', value: 'Space and science: cosmic visuals, planets, stars, and abstract motion. Educational and awe-inspiring.' },
  { label: 'Education / explainer', value: 'Education explainer: clear visuals, step-by-step graphics, and friendly tone. Easy to follow.' },
  { label: 'Talking head / vlog', value: 'Talking head vlog: minimal overlays, lower-thirds, and B-roll cutaways. Personal and engaging.' },
  { label: 'Abstract / minimal', value: 'Abstract and minimal: subtle motion, gradients, and typography. Calm and modern.' },
];

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
  srtDataLength,
}) => {
  const primaryLabel = !apiKey
    ? 'No API Key — Enter Manual Mode'
    : srtDataLength === 0
      ? 'Enter Demo Studio'
      : 'Enter Studio & Auto-Generate';

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      <div className="flex-1 flex flex-col items-center justify-center w-full animate-fade-in py-8">
        <div className="container w-full flex justify-center px-4">
          <Card className="w-full max-w-2xl overflow-hidden rounded-2xl border-border shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="text-center space-y-3 px-6 pt-8 pb-4">
              <div className="mx-auto size-14 rounded-2xl bg-[linear-gradient(135deg,#c084fc,#db2777)] flex items-center justify-center text-white shadow-md">
                <LayoutTemplate className="size-7" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                Director&apos;s Studio
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                {isAudioOnly
                  ? 'Audio-only mode: we\'ll generate full-screen visuals to accompany your script.'
                  : 'Add optional context for your video. We\'ll use it to auto-generate the first animation scene.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-2 pb-8 space-y-6">
              <section aria-labelledby="topic-label" className="space-y-3">
                <Label id="topic-label" htmlFor="topic-context" className="text-sm font-medium text-foreground">
                  Video topic / visual context <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">Pick a template or type your own. Leave empty for a generic style.</p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_TEMPLATES.map((tpl) => (
                    <Button
                      key={tpl.label}
                      type="button"
                      variant={topicContext === tpl.value ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onTopicContextChange(tpl.value)}
                      className="rounded-lg text-xs"
                      aria-pressed={topicContext === tpl.value}
                    >
                      {tpl.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onTopicContextChange('')}
                    className="rounded-lg text-xs text-muted-foreground"
                    aria-pressed={!topicContext}
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  id="topic-context"
                  value={topicContext}
                  onChange={(e) => onTopicContextChange(e.target.value)}
                  placeholder={
                    isAudioOnly
                      ? 'e.g. Visuals about space exploration, planets and stars.'
                      : 'e.g. This video explains Quantum Tunneling. I want particles passing through barriers…'
                  }
                  className="w-full min-h-24 resize-none rounded-xl border-border"
                  aria-describedby="topic-hint"
                />
                <p id="topic-hint" className="text-[11px] text-muted-foreground">
                  This helps the AI match visuals to your content. You can also leave it blank.
                </p>
              </section>

              <section aria-label="Actions" className="space-y-4">
                <Button
                  variant="gradient"
                  onClick={onEnterStudio}
                  disabled={isGenerating}
                  className="w-full h-12 rounded-xl gap-2 font-semibold"
                  size="lg"
                  aria-busy={isGenerating}
                  aria-live="polite"
                >
                  {isGenerating ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" aria-hidden />
                      Generating scene…
                    </>
                  ) : (
                    <>
                      <Edit3 className="size-5 shrink-0" aria-hidden />
                      {primaryLabel}
                    </>
                  )}
                </Button>

                {isGenerating && showManualButton && (
                  <div className="animate-fade-in text-center pt-1">
                    <p className="text-sm text-muted-foreground mb-2">Taking longer than expected?</p>
                    <Button variant="link" size="sm" onClick={onManualModeEnter} className="text-primary">
                      Skip & enter manual mode
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-destructive">Generation failed</h4>
                        <p className="text-sm text-destructive/90 mt-1 leading-relaxed">{error}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-8 flex-wrap">
                      <Button variant="outline" size="sm" onClick={onResetAuth} className="rounded-lg">
                        Update API key
                      </Button>
                      <Button variant="outline" size="sm" onClick={onManualModeEnter} className="rounded-lg">
                        Continue in manual mode
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
