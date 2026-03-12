import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, AlertTriangle, ExternalLink, PlayCircle } from 'lucide-react';
import { validateGeminiConnection } from '@/services/geminiService';
import { APP_CONFIG } from '../../../config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="min-h-screen flex items-center justify-center bg-page p-6 relative overflow-hidden">
      {/* Background ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-secondary/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none" aria-hidden />

      <div className="max-w-xl w-full bg-surface/90 backdrop-blur-xl border border-edge rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 animate-fade-in flex flex-col items-center">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary mb-6 shadow-lg shadow-accent/20 rotate-3 hover:rotate-6 transition-transform duration-300">
            <PlayCircle className="text-white fill-white/20" size={44} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-accent/90 to-accent-secondary/90 tracking-tight leading-tight">
            Reel Composer
          </h1>
          <p className="text-ink-muted mt-4 text-lg font-normal max-w-sm mx-auto leading-relaxed">
            AI-powered director for high-retention video content.
          </p>
          <a href="https://blog.prasannathapa.in/reel-composer/" target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs font-semibold text-accent hover:text-ink uppercase tracking-widest border-b border-accent/40 hover:border-ink transition-colors pb-0.5 focus-ring rounded-sm">
            Read The Philosophy
          </a>
        </div>

        <div className="w-full space-y-5 animate-fade-in">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="welcome-api-key">Google Gemini API Key</Label>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-medium transition-colors focus-ring rounded">
                <ExternalLink size={12} /> Get Free Key
              </a>
            </div>
            <Input
              id="welcome-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API Key here (AIzaSy...)"
              autoComplete="off"
            />
            <div className="flex items-start gap-2">
              <ShieldCheck className="text-success shrink-0 mt-0.5 opacity-90" size={14} />
              <p className="text-[11px] text-ink-subtle leading-snug">
                Your key is stored locally in your browser and sent directly to Google.
              </p>
            </div>
          </div>

          <Button
            onClick={handleValidation}
            disabled={isValidating}
            className="w-full h-auto py-4"
          >
            {isValidating ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-ink-subtle border-t-ink rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <>Enter Studio <ArrowRight size={20} /></>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-danger-muted border border-danger/30 rounded-xl text-danger text-sm flex items-center justify-center gap-2 animate-shake text-center">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="pt-5 border-t border-edge text-center">
            <Button variant="ghost" size="sm" onClick={handleManualSkip} className="h-auto py-1">
              Or enter manual mode (No AI features)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
