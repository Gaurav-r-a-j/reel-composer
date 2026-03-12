import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Code2,
  Download,
  ExternalLink,
  PlayCircle,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { validateGeminiConnection } from '@/services/geminiService';
import { APP_CONFIG } from '../../../config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ModeToggle } from '@/components/layout/ModeToggle';

interface WelcomeScreenProps {
  onComplete: (apiKey: string | null, model?: string, saveManualMode?: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedModel = APP_CONFIG.DEFAULT_MODEL;

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const defaultKey = APP_CONFIG.DEFAULT_API_KEY || '';
    if (storedKey) {
      setApiKey(storedKey);
    } else if (defaultKey) {
      setApiKey(defaultKey);
    }
  }, []);

  const handleValidation = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API Key.');
      return;
    }

    setIsValidating(true);
    setError(null);

    const isValid = await validateGeminiConnection(apiKey, selectedModel);

    setIsValidating(false);

    if (isValid) {
      onComplete(apiKey, selectedModel);
    } else {
      setError('Connection failed. Please check your key.');
    }
  };

  const handleManualSkip = () => {
    onComplete(null);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f0ff_0%,#e8f0fe_45%,#e0f2fe_100%)] dark:bg-[linear-gradient(180deg,#060417_0%,#020617_45%,#020617_100%)] relative overflow-x-hidden flex flex-col text-foreground">
      {/* Grid pattern fading to bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(148,163,184,0.2) 0, rgba(148,163,184,0.2) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(to bottom, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 1px, transparent 1px, transparent 24px)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden
      />
      {/* Soft noise */}
      <div
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      {/* Top bar */}
      <header className="relative z-10 py-4 md:py-6">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center shadow-md">
              <PlayCircle className="size-5 text-white" />
            </div>
            <span className="font-semibold text-foreground">Reel Composer</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="relative z-10 flex-1 container max-w-4xl mx-auto pb-16">
        {/* Hero: title + subtitle */}
        <section className="text-center pt-2 pb-6 md:pt-4 md:pb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] bg-clip-text text-transparent">
              Reel Composer
            </span>
          </h1>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground font-medium">
            Turn Talking-Head Videos into Viral Edutainment Reels
          </p>
        </section>

        {/* Screenshot area – stylised as a single image block */}
        <section className="mb-12 md:mb-16">
          <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/10 dark:shadow-xl dark:shadow-black/30">
            <CardContent className="p-0">
              <div className="relative w-full overflow-hidden">
                {/* Replace this block with a real <img src=\"/reel-hero.png\" /> when you move the PNG into public. */}
                <div className="aspect-[16/9] bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.3)_0,_transparent_55%),linear-gradient(135deg,#020617,#020617_35%,#0b1120_65%,#111827_100%)] flex items-center justify-center">
                  <div className="w-[88%] max-w-4xl h-[78%] rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border border-white/10 shadow-[0_40px_80px_rgba(15,23,42,0.8)] flex items-center justify-center px-6 md:px-10">
                    <div className="grid grid-cols-[1.1fr_0.9fr] gap-6 w-full items-center">
                      <div className="h-32 md:h-40 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.45)_0,_transparent_55%),linear-gradient(135deg,#020617,#020617_40%,#111827_100%)] shadow-inner shadow-black/60" />
                      <div className="relative h-32 md:h-40 rounded-2xl bg-[linear-gradient(135deg,#f97316,#ec4899,#6366f1)] shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7)_0,_transparent_55%)] opacity-70" />
                        <div className="relative h-full flex flex-col justify-end pb-4 px-4 gap-2">
                          <div className="flex gap-2 items-end w-full">
                            <div className="w-4 md:w-5 h-6 md:h-8 rounded-full bg-white/80" />
                            <div className="w-4 md:w-5 h-8 md:h-12 rounded-full bg-white" />
                            <div className="w-4 md:w-5 h-10 md:h-16 rounded-full bg-sky-100" />
                            <div className="w-4 md:w-5 h-12 md:h-20 rounded-full bg-emerald-100" />
                          </div>
                          <div className="flex gap-1 justify-end">
                            <Sparkles className="size-3.5 text-amber-300" />
                            <Sparkles className="size-3.5 text-amber-300" />
                            <Sparkles className="size-3.5 text-amber-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Steps row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16">
          <Card className="text-center rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="pt-6 pb-5 px-5">
              <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] flex items-center justify-center shadow-md">
                <Upload className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-foreground">1. Upload Video</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add your video & subtitles</p>
            </CardContent>
          </Card>
          <Card className="text-center rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="pt-6 pb-5 px-5">
              <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center shadow-md">
                <Sparkles className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-foreground">2. AI Generates Animation</h3>
              <p className="mt-1 text-sm text-muted-foreground">Gemini creates dynamic visuals</p>
            </CardContent>
          </Card>
          <Card className="text-center rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="pt-6 pb-5 px-5">
              <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#60A5FA)] flex items-center justify-center shadow-md">
                <Download className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-foreground">3. Export Reel</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get your shareable clip</p>
            </CardContent>
          </Card>
        </section>

        {/* Set up Gemini API Key */}
        <section className="mb-12 md:mb-16">
          <Card className="rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Set Up Your{' '}
                <span className="bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] bg-clip-text text-transparent">
                  Gemini API Key
                </span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your Google Gemini API key to start creating:
              </p>
              <div className="mt-4 space-y-2">
                <Label htmlFor="welcome-api-key" className="sr-only">
                  Gemini API key
                </Label>
                <Input
                  id="welcome-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API key here"
                  autoComplete="off"
                  className="h-11 rounded-xl bg-muted/50 border-border"
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Stored locally in your browser.</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Get API Key <ExternalLink className="size-3" />
                  </a>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Google AI Studio
                  </a>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Button
                  onClick={handleValidation}
                  disabled={isValidating}
                  className="w-full h-11 rounded-xl bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] hover:opacity-90 text-white font-semibold shadow-md"
                >
                  {isValidating ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Start creating'
                  )}
                </Button>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="size-4 shrink-0" /> {error}
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={handleManualSkip}
                    className="text-primary font-medium hover:underline"
                  >
                    Launch in manual mode (no AI)
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16">
          <Card className="rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="p-5">
              <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center mb-3">
                <Sparkles className="size-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground">AI-Generated Graphics</h3>
              <p className="mt-1 text-sm text-muted-foreground">Smart visuals from your script</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="p-5">
              <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#0D9488,#2DD4BF)] flex items-center justify-center mb-3">
                <Code2 className="size-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground">Tech Content Focused</h3>
              <p className="mt-1 text-sm text-muted-foreground">Perfect for coding & design videos</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md border-border/80 overflow-hidden">
            <CardContent className="p-5">
              <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#60A5FA)] flex items-center justify-center mb-3">
                <Zap className="size-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground">Fast & Automated</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create reels in minutes</p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Ready to Create?</h2>
          <p className="text-muted-foreground">Upload your video & subtitles to get started!</p>
          <Button
            onClick={handleValidation}
            disabled={isValidating}
            size="lg"
            className="h-12 md:h-14 px-8 md:px-12 rounded-2xl text-base font-bold bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] hover:opacity-90 text-white shadow-lg"
          >
            {isValidating ? 'Verifying...' : 'Launch Editor'}
          </Button>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <span className="size-5 rounded bg-muted flex items-center justify-center font-mono text-[10px] font-bold">
              P
            </span>
            Plus Jakarta Sans
          </p>
        </footer>
      </main>
    </div>
  );
};
