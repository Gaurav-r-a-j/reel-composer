import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, AlertTriangle, ExternalLink, PlayCircle } from 'lucide-react';
import { validateGeminiConnection } from '@/services/geminiService';
import { APP_CONFIG } from '../../../config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModeToggle } from '@/components/layout/ModeToggle';

interface WelcomeScreenProps {
  onComplete: (apiKey: string | null, model?: string, saveManualMode?: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default model enforced internally
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
      setError("Please enter a valid API Key.");
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    const isValid = await validateGeminiConnection(apiKey, selectedModel);
    
    setIsValidating(false);
    
    if (isValid) {
      onComplete(apiKey, selectedModel);
    } else {
      setError("Connection failed. Please check your key.");
    }
  };

  const handleManualSkip = () => {
    // Pass null to indicate manual mode (no API key)
    onComplete(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none" aria-hidden />

      {/* Top bar */}
      <header className="relative z-10 py-6">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-sm">
              <PlayCircle className="text-primary-foreground/90" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Reel Composer
              </span>
              <span className="text-xs text-muted-foreground">
                AI director for high-retention video
              </span>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center py-6">
        <div className="container max-w-5xl mx-auto grid gap-10 md:gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] items-start md:items-center">
          {/* Left: hero copy */}
          <div className="space-y-6">
            <div className="space-y-3 max-w-xl">
              <h1 className="text-3xl md:text-4xl font-semibold md:font-bold tracking-tight leading-tight text-foreground">
                Turn raw ideas into
              </h1>
              <p className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-primary">
                scroll-stopping short videos.
              </p>
              <p className="text-sm md:text-base text-muted-foreground max-w-md">
                Connect your Google Gemini key once. We&apos;ll handle scripting, layout and pacing so you can focus on direction.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground/90">What you get:</p>
              <ul className="space-y-1.5">
                <li>• Smart scene breakdown from your subtitles.</li>
                <li>• A ready-to-edit studio with timing and layout.</li>
                <li>• Manual mode if you want to skip AI entirely.</li>
              </ul>
              <Button variant="link" size="sm" asChild className="px-0">
                <a href="https://blog.prasannathapa.in/reel-composer/" target="_blank" rel="noreferrer">
                  Read the philosophy behind Reel Composer
                </a>
              </Button>
            </div>
          </div>

          {/* Right: connection panel */}
          <div className="flex justify-end">
            <Card className="w-full max-w-md shadow-md">
              <CardHeader className="pb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Step 1 · Connect Gemini
                </p>
                <CardTitle className="text-lg">Google Gemini API Key</CardTitle>
                <CardDescription className="text-sm">
                  Your key stays in this browser and is sent only to Google for generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <Label htmlFor="welcome-api-key" className="text-foreground font-medium">
                      API Key
                    </Label>
                    <Button variant="link" size="sm" asChild className="gap-1.5 px-0">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <ExternalLink size={14} /> Get free key
                      </a>
                    </Button>
                  </div>
                  <Input
                    id="welcome-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API key here (AIzaSy...)"
                    autoComplete="off"
                    className="h-10 px-3 py-2"
                  />
                  <p className="flex items-start gap-2.5 text-xs text-muted-foreground leading-snug">
                    <ShieldCheck className="text-primary shrink-0 mt-0.5" size={14} />
                    Stored securely in local storage; you can remove it anytime from settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleValidation} disabled={isValidating} className="w-full gap-2" size="lg">
                    {isValidating ? (
                      <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying key...
                      </span>
                    ) : (
                      <>
                        Enter Studio
                        <ArrowRight size={18} className="shrink-0" />
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs flex items-center justify-center gap-2 animate-shake text-center">
                      <AlertTriangle size={14} className="shrink-0" /> {error}
                    </div>
                  )}
                </div>

                <div className="pt-1 text-center">
                  <Button variant="ghost" size="sm" onClick={handleManualSkip} className="gap-1.5">
                    Enter manual mode (no AI features)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
