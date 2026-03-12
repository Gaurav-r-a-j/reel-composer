import React, { useEffect, useRef, useState } from 'react';
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
import { AppFooter } from '@/components/layout/AppFooter';

const GRID_BG_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(to right, rgba(148,163,184,0.1) 0, rgba(148,163,184,0.1) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(to bottom, rgba(148,163,184,0.08) 0, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 24px)',
  maskImage:
    'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)',
  WebkitMaskImage:
    'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)',
};

function WelcomeGridBg() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={GRID_BG_STYLE}
      aria-hidden
    />
  );
}

function WelcomeHeader() {
  return (
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
  );
}

function WelcomeHero() {
  return (
    <>
      <section className="text-center pt-6 pb-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] bg-clip-text text-transparent">
            Reel Composer
          </span>
        </h1>
      </section>
      <section className="text-center pb-8">
        <p className="text-lg md:text-xl text-muted-foreground font-medium">
          Turn Talking-Head Videos into Viral Edutainment Reels
        </p>
      </section>
    </>
  );
}

interface GeminiSetupCardProps {
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  onValidate: () => void;
  onManualMode: () => void;
  isValidating: boolean;
  error: string | null;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

function GeminiSetupCard({
  apiKey,
  onApiKeyChange,
  onValidate,
  onManualMode,
  isValidating,
  error,
  sectionRef,
}: GeminiSetupCardProps) {
  return (
    <section ref={sectionRef} className="mb-12 md:mb-14" aria-label="Set up Gemini API key">
      <Card className="rounded-2xl border-border/80 overflow-hidden">
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
              onChange={(e) => onApiKeyChange(e.target.value)}
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
              variant="gradient"
              onClick={onValidate}
              disabled={isValidating}
              className="w-full h-11 rounded-xl"
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
              <Button variant="link" type="button" onClick={onManualMode} className="text-xs h-auto p-0">
                Launch in manual mode (no AI)
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function WelcomeSteps() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-14">
      <Card className="text-center rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="pt-6 pb-5 px-5">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] flex items-center justify-center shadow-md">
            <Upload className="size-6 text-white" />
          </div>
          <h3 className="font-bold text-foreground">1. Upload Video</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your video & subtitles</p>
        </CardContent>
      </Card>
      <Card className="text-center rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="pt-6 pb-5 px-5">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center shadow-md">
            <Sparkles className="size-6 text-white" />
          </div>
          <h3 className="font-bold text-foreground">2. AI Generates Animation</h3>
          <p className="mt-1 text-sm text-muted-foreground">Gemini creates dynamic visuals</p>
        </CardContent>
      </Card>
      <Card className="text-center rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="pt-6 pb-5 px-5">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#60A5FA)] flex items-center justify-center shadow-md">
            <Download className="size-6 text-white" />
          </div>
          <h3 className="font-bold text-foreground">3. Export Reel</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get your shareable clip</p>
        </CardContent>
      </Card>
    </section>
  );
}

function WelcomeFeatures() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-14">
      <Card className="rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="p-5">
          <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center mb-3">
            <Sparkles className="size-5 text-white" />
          </div>
          <h3 className="font-bold text-foreground">AI-Generated Graphics</h3>
          <p className="mt-1 text-sm text-muted-foreground">Smart visuals from your script</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="p-5">
          <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#0D9488,#2DD4BF)] flex items-center justify-center mb-3">
            <Code2 className="size-5 text-white" />
          </div>
          <h3 className="font-bold text-foreground">Tech Content Focused</h3>
          <p className="mt-1 text-sm text-muted-foreground">Perfect for coding & design videos</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/80 overflow-hidden">
        <CardContent className="p-5">
          <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#60A5FA)] flex items-center justify-center mb-3">
            <Zap className="size-5 text-white" />
          </div>
          <h3 className="font-bold text-foreground">Fast & Automated</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create reels in minutes</p>
        </CardContent>
      </Card>
    </section>
  );
}

interface WelcomeCtaProps {
  onLaunch: () => void;
  isValidating: boolean;
  hasApiKey: boolean;
}

function WelcomeCta({ onLaunch, isValidating, hasApiKey }: WelcomeCtaProps) {
  return (
    <section className="text-center space-y-4" aria-label="Get started">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">Ready to create?</h2>
      <p className="text-muted-foreground">Upload your video and subtitles to get started.</p>
      <Button
        variant="gradient"
        onClick={onLaunch}
        disabled={isValidating}
        size="lg"
        className="h-12 md:h-14 px-8 md:px-12 rounded-2xl text-base font-bold"
        aria-busy={isValidating}
      >
        {isValidating ? 'Verifying…' : 'Launch Editor'}
      </Button>
      {!hasApiKey && !isValidating && (
        <p className="text-xs text-muted-foreground">Enter your API key above, or use manual mode to skip.</p>
      )}
    </section>
  );
}

interface WelcomeScreenProps {
  onComplete: (apiKey: string | null, model?: string, saveManualMode?: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedModel = APP_CONFIG.DEFAULT_MODEL;

  const geminiSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const defaultKey = APP_CONFIG.DEFAULT_API_KEY || '';
    if (storedKey) setApiKey(storedKey);
    else if (defaultKey) setApiKey(defaultKey);
  }, []);

  useEffect(() => {
    if (error) {
      geminiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const handleValidation = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API Key.');
      return;
    }
    setIsValidating(true);
    setError(null);
    const isValid = await validateGeminiConnection(apiKey, selectedModel);
    setIsValidating(false);
    if (isValid) onComplete(apiKey, selectedModel);
    else setError('Connection failed. Please check your key.');
  };

  const handleManualSkip = () => onComplete(null);

  return (
    <div className="min-h-screen bg-background relative text-foreground">
      <WelcomeGridBg />
      <WelcomeHeader />
      <main className="relative z-10 container max-w-4xl mx-auto px-4 pb-20">
        <WelcomeHero />
        <GeminiSetupCard
          sectionRef={geminiSectionRef}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onValidate={handleValidation}
          onManualMode={handleManualSkip}
          isValidating={isValidating}
          error={error}
        />
        <WelcomeSteps />
        <WelcomeFeatures />
        <WelcomeCta onLaunch={handleValidation} isValidating={isValidating} hasApiKey={!!apiKey.trim()} />
      </main>
      <div className="mt-14">
        <AppFooter />
      </div>
    </div>
  );
};
