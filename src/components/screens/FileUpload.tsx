import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileVideo, FileText, ArrowRight, Download, ExternalLink, Music, Play, Clapperboard, Sparkles, CheckSquare, Edit2, Save, X, Trash2, ArrowLeft } from 'lucide-react';
import { extractWavFromVideo } from '@/utils/audioHelpers';
import { generateSRT, generateTTS } from '@/services/geminiService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ModeToggle } from '@/components/layout/ModeToggle';
import { AppFooter } from '@/components/layout/AppFooter';

interface FileUploadProps {
  onFilesSelected: (videoFile: File, srtFile: File, isAudioOnly: boolean) => void;
  apiKey: string;
  onBack: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, apiKey, onBack }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  
  // --- Split State for SRT ---
  const [videoSrt, setVideoSrt] = useState<File | null>(null);
  const [audioSrt, setAudioSrt] = useState<File | null>(null);

  // Computed Current SRT
  const currentSrt = activeTab === 'video' ? videoSrt : audioSrt;
  const setCurrentSrt = (file: File | null) => {
    if (activeTab === 'video') setVideoSrt(file);
    else setAudioSrt(file);
  };

  const [srtContent, setSrtContent] = useState<string>(""); // For editing
  const [isEditingSrt, setIsEditingSrt] = useState(false);

  // --- Video Mode State ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAutoGeneratingSRT, setIsAutoGeneratingSRT] = useState(false);
  
  // --- Audio/TTS Mode State ---
  const [audioSourceType, setAudioSourceType] = useState<'upload' | 'tts'>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null); // Source upload
  const [ttsScript, setTtsScript] = useState('');
  const [ttsVoice, setTtsVoice] = useState<'male' | 'female'>('male');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedAudioFile, setGeneratedAudioFile] = useState<File | null>(null); // Result of TTS

  // --- Refs ---
  const generationActiveRef = useRef(false);

  // --- Effects ---
  
  // When the active SRT file changes (or tab switch), load content
  useEffect(() => {
    if (currentSrt) {
      currentSrt.text().then(text => setSrtContent(text));
    } else {
      setSrtContent("");
    }
    // Reset editing mode on tab switch or file clear
    setIsEditingSrt(false);
  }, [currentSrt, activeTab]);

  // --- Common Helpers ---

  const handleSrtSave = () => {
    // Convert edited string back to File
    const file = new File([srtContent], currentSrt?.name || "edited.srt", { type: "text/plain" });
    setCurrentSrt(file);
    setIsEditingSrt(false);
  };

  const handleDownloadSrt = () => {
    if (!currentSrt) return;
    const url = URL.createObjectURL(currentSrt);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentSrt.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    const fileToDownload = generatedAudioFile || audioFile;
    if (!fileToDownload) return;
    const url = URL.createObjectURL(fileToDownload);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileToDownload.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Handlers: Video Mode ---
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSrtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentSrt(e.target.files[0]);
    }
  };

  const handleExtractAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoFile) return;
    setIsExtracting(true);
    try {
      await extractWavFromVideo(videoFile);
    } catch (e) {
      alert("Failed to extract audio.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAutoGenerateSRT = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Identify Source: Video File OR Audio File (Uploaded or Generated)
    let sourceFile: File | null = null;
    if (activeTab === 'video') sourceFile = videoFile;
    else sourceFile = generatedAudioFile || audioFile;

    if (!sourceFile) {
        alert("Please upload/generate media first.");
        return;
    }
    if (!apiKey) {
      alert("Please configure your API Key in settings first.");
      return;
    }

    setIsAutoGeneratingSRT(true);
    generationActiveRef.current = true;

    try {
      const srtString = await generateSRT(sourceFile, apiKey);
      
      // Check if cancelled during await
      if (!generationActiveRef.current) return;

      const file = new File([srtString], "auto_generated.srt", { type: "text/plain" });
      setCurrentSrt(file);
    } catch (err: any) {
      // Check if cancelled during await
      if (!generationActiveRef.current) return;
      
      console.error(err);
      // ERROR FIX: Show the actual API error instead of generic 20MB warning
      alert(`Auto-generation failed: ${err.message || "Unknown error occurred"}`);
    } finally {
      if (generationActiveRef.current) {
        setIsAutoGeneratingSRT(false);
        generationActiveRef.current = false;
      }
    }
  };

  const handleCancelGeneration = (e: React.MouseEvent) => {
    e.stopPropagation();
    generationActiveRef.current = false;
    setIsAutoGeneratingSRT(false);
  };

  // --- Handlers: Audio/TTS Mode ---
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setAudioFile(e.target.files[0]);
        setGeneratedAudioFile(null); // Clear previous TTS if uploading new
        setAudioSrt(null); // Reset SRT when new audio is uploaded
    }
  };

  const handleGenerateTTS = async () => {
    if (!ttsScript.trim() || !apiKey) return;
    setIsGeneratingAudio(true);
    try {
      // 1. Generate Audio Blob
      const audioBlob = await generateTTS(ttsScript, ttsVoice, apiKey);
      const audioFile = new File([audioBlob], `generated_${ttsVoice}.wav`, { type: 'audio/wav' });
      setGeneratedAudioFile(audioFile);
      setAudioFile(null); // Clear upload if TTS is used
      setAudioSrt(null); // Reset SRT so user can generate new one

      // Note: We do NOT auto-generate SRT anymore, user must click the button.
    } catch (err) {
      console.error(err);
      alert("Failed to generate audio. See console for details.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };


  const handleNext = () => {
    if (activeTab === 'video') {
      if (videoFile && currentSrt) {
        onFilesSelected(videoFile, currentSrt, false);
      }
    } else {
      // For audio mode, use generated file OR uploaded file
      const finalAudio = generatedAudioFile || audioFile;
      if (finalAudio && currentSrt) {
        onFilesSelected(finalAudio, currentSrt, true);
      }
    }
  };

  const handleRemoveVideo = (e: React.MouseEvent) => {
      e.stopPropagation();
      setVideoFile(null);
  };

  const handleRemoveAudio = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAudioFile(null);
      setGeneratedAudioFile(null);
  };

  const handleRemoveSrt = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentSrt(null);
  };

  // --- Renderers ---

  // Reusable SRT (Subtitles) section
  const renderSRTSection = () => {
    const isTTSMode = activeTab === 'audio' && audioSourceType === 'tts';
    const hasSource = activeTab === 'video' ? !!videoFile : (!!audioFile || !!generatedAudioFile);

    return (
        <div className={`border-2 border-dashed rounded-xl transition-all min-h-[260px] relative overflow-hidden flex flex-col ${currentSrt ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/30'}`}>
            <input type="file" accept=".srt" onChange={handleSrtChange} className="hidden" id="srt-upload" disabled={isAutoGeneratingSRT || isTTSMode} />
            {!isEditingSrt ? (
                <>
                    {currentSrt ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full min-h-[260px]">
                            <Button type="button" variant="outline" size="icon-sm" onClick={handleRemoveSrt} className="absolute top-3 right-3 z-20 rounded-lg" title="Remove captions">
                                <X className="size-4" />
                            </Button>
                            <div className="p-3 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] text-white mb-3 shadow-sm">
                                <CheckSquare className="size-6" />
                            </div>
                            <p className="font-semibold text-foreground text-sm max-w-[85%] truncate mb-0.5">{currentSrt.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mb-4">{(currentSrt.size / 1024).toFixed(1)} KB</p>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingSrt(true)} className="rounded-lg gap-1.5">
                                    <Edit2 className="size-3.5" /> Edit
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleDownloadSrt} className="rounded-lg gap-1.5">
                                    <Download className="size-3.5" /> Download
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[260px] space-y-5">
                            <p className="text-sm font-medium text-foreground">Add captions</p>
                            <p className="text-xs text-muted-foreground max-w-xs text-center">Generate from your media with AI or upload an existing .SRT file.</p>
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="gradient"
                                        size="sm"
                                        onClick={handleAutoGenerateSRT}
                                        disabled={!hasSource || isAutoGeneratingSRT}
                                        className="flex-1 rounded-lg gap-2 h-9"
                                    >
                                        {isAutoGeneratingSRT ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="size-4" />}
                                        {isAutoGeneratingSRT ? 'Generating…' : 'Auto-Generate (AI)'}
                                    </Button>
                                    {isAutoGeneratingSRT && (
                                        <Button type="button" variant="destructive" size="icon" onClick={handleCancelGeneration} className="rounded-lg shrink-0" title="Cancel">
                                            <X className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                {!isTTSMode && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isAutoGeneratingSRT}
                                        className="w-full rounded-lg gap-2 h-9"
                                        onClick={() => document.getElementById('srt-upload')?.click()}
                                    >
                                        <Upload className="size-4" /> Upload .SRT
                                    </Button>
                                )}
                                {!hasSource && activeTab === 'video' && <p className="text-[11px] text-muted-foreground text-center">Upload a video first to use Auto-Generate.</p>}
                                {!hasSource && activeTab === 'audio' && <p className="text-[11px] text-muted-foreground text-center">Add audio first to use Auto-Generate.</p>}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col h-full min-h-[260px] w-full bg-background rounded-xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
                        <span className="text-xs font-semibold text-muted-foreground">Editing subtitles</span>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsEditingSrt(false)} className="rounded-lg"><X className="size-4" /></Button>
                    </div>
                    <Textarea value={srtContent} onChange={(e) => setSrtContent(e.target.value)} className="flex-1 w-full min-h-0 resize-none rounded-none border-0 focus-visible:ring-0" spellCheck={false} />
                    <div className="p-3 border-t border-border">
                        <Button variant="gradient" type="button" onClick={handleSrtSave} className="w-full rounded-lg gap-2">
                            <Save className="size-4" /> Save changes
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative bg-background">
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] flex items-center justify-center">
              <Play className="size-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Reel Composer</span>
          </div>
          <ModeToggle />
        </div>
      </header>
      <div className="flex-1 flex flex-col w-full overflow-y-auto">
          <div className="container max-w-4xl mx-auto space-y-8 py-8 px-4">
            <section className="text-center space-y-2" aria-label="Title">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="bg-[linear-gradient(90deg,#8B5CF6,#3B82F6)] bg-clip-text text-transparent">
                  Create viral shorts
                </span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Upload your source and captions, then enter the studio.
              </p>
            </section>

            <div className="flex w-full max-w-sm mx-auto rounded-xl border border-border bg-muted/30 p-1">
                <Button
                    type="button"
                    variant={activeTab === 'video' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('video')}
                    className="flex-1 rounded-lg gap-2 py-2.5 font-medium"
                >
                    <Clapperboard className="size-4" /> Video Studio
                </Button>
                <Button
                    type="button"
                    variant={activeTab === 'audio' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('audio')}
                    className="flex-1 rounded-lg gap-2 py-2.5 font-medium"
                >
                    <Music className="size-4" /> Audio Visualizer
                </Button>
            </div>

            <Card className="w-full overflow-hidden rounded-2xl border-border shadow-sm">
              <CardContent className="p-0">
                {activeTab === 'video' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <section className="p-6 space-y-4" aria-labelledby="source-heading">
                    <h2 id="source-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clapperboard className="size-4 text-primary" /> Source footage
                    </h2>
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all min-h-[260px] relative overflow-hidden group ${videoFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-muted/40'}`}>
                        <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
                        {videoFile ? (
                            <div className="relative w-full min-h-[260px] flex flex-col items-center justify-center z-10">
                                <Button type="button" variant="outline" size="icon-sm" onClick={handleRemoveVideo} className="absolute top-3 right-3 rounded-lg" title="Remove video">
                                    <X className="size-4" />
                                </Button>
                                <div className="p-4 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] text-white mb-4 shadow-sm">
                                    <FileVideo className="size-8" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="font-semibold text-foreground truncate max-w-[220px]">{videoFile.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleExtractAudio} disabled={isExtracting} className="absolute bottom-4 right-4 z-20 rounded-lg gap-1.5">
                                    {isExtracting ? <span className="animate-pulse">Processing…</span> : <><Download className="size-3.5" /> Get WAV</>}
                                </Button>
                            </div>
                        ) : (
                            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 w-full min-h-[260px] z-10">
                                <div className="p-4 rounded-xl bg-muted/80 text-primary group-hover:bg-primary/10 transition-colors duration-200">
                                    <FileVideo className="size-8" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-foreground">Select video</p>
                                    <p className="text-xs text-muted-foreground">MP4, MOV, WEBM · or drag and drop</p>
                                </div>
                            </label>
                        )}
                    </div>
                    </section>

                    <section className="p-6 space-y-4" aria-labelledby="subtitles-heading">
                    <h2 id="subtitles-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="size-4 text-primary" /> Subtitles
                    </h2>
                    {renderSRTSection()}
                    </section>
                </div>
                ) : (
                // --- AUDIO / TTS MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <section className="p-6 space-y-4" aria-labelledby="audio-source-heading">
                        <h2 id="audio-source-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Music className="size-4 text-primary" /> Audio source
                        </h2>
                        <div className="flex p-1 rounded-xl border border-border bg-muted/30 w-fit">
                            <Button type="button" variant={audioSourceType === 'upload' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAudioSourceType('upload')} className="rounded-lg px-3">
                                Upload file
                            </Button>
                            <Button type="button" variant={audioSourceType === 'tts' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAudioSourceType('tts')} className="rounded-lg px-3">
                                Text to speech
                            </Button>
                        </div>

                        {audioSourceType === 'upload' ? (
                            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all min-h-[260px] relative overflow-hidden group ${audioFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-muted/40'}`}>
                                <input type="file" accept="audio/*,.wav,.mp3,.m4a" onChange={handleAudioFileChange} className="hidden" id="audio-upload" />
                                {audioFile ? (
                                    <>
                                        <Button type="button" variant="outline" size="icon-sm" onClick={handleRemoveAudio} className="absolute top-3 right-3 z-20 rounded-lg" title="Remove audio">
                                            <X className="size-4" />
                                        </Button>
                                        <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full min-h-[220px] z-10">
                                            <div className="p-4 rounded-xl bg-[linear-gradient(135deg,#8B5CF6,#3B82F6)] text-white shadow-sm">
                                                <Music className="size-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground truncate max-w-[220px]">{audioFile.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                            </div>
                                        </label>
                                    </>
                                ) : (
                                    <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 w-full min-h-[260px]">
                                        <div className="p-4 rounded-xl bg-muted/80 text-primary group-hover:bg-primary/10 transition-colors duration-200">
                                            <Music className="size-8" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-semibold text-foreground">Drop audio file</p>
                                            <p className="text-xs text-muted-foreground">WAV, MP3, M4A · or drag and drop</p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="min-h-[260px] flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4">
                                <p className="text-xs font-medium text-muted-foreground">Voice</p>
                                <div className="flex gap-2">
                                    <Button variant={ttsVoice === 'male' ? 'secondary' : 'outline'} size="sm" onClick={() => setTtsVoice('male')} className="flex-1 rounded-lg">
                                        Male
                                    </Button>
                                    <Button variant={ttsVoice === 'female' ? 'secondary' : 'outline'} size="sm" onClick={() => setTtsVoice('female')} className="flex-1 rounded-lg">
                                        Female
                                    </Button>
                                </div>
                                <Label className="text-xs font-medium text-muted-foreground">Script</Label>
                                <Textarea
                                    value={ttsScript}
                                    onChange={(e) => setTtsScript(e.target.value)}
                                    placeholder="Paste or type your script…"
                                    className="flex-1 min-h-[100px] w-full resize-none rounded-xl border-border"
                                />
                                <Button variant="gradient" onClick={handleGenerateTTS} disabled={isGeneratingAudio || !ttsScript || !apiKey} className="w-full rounded-lg gap-2 h-10">
                                    {isGeneratingAudio ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="size-4" />}
                                    {isGeneratingAudio ? 'Synthesizing…' : 'Generate audio (AI)'}
                                </Button>
                            </div>
                        )}

                        {(generatedAudioFile || audioFile) && (
                            <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-3 animate-fade-in">
                                <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                                    <Music className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{(generatedAudioFile || audioFile)?.name}</p>
                                    <audio controls src={URL.createObjectURL(generatedAudioFile || audioFile!)} className="w-full h-8 mt-1.5 accent-primary" />
                                </div>
                                <Button variant="outline" size="icon-sm" onClick={handleDownloadAudio} className="rounded-lg shrink-0" title="Download">
                                    <Download className="size-4" />
                                </Button>
                            </div>
                        )}
                    </section>

                    <section className="p-6 space-y-4" aria-labelledby="audio-subtitles-heading">
                    <h2 id="audio-subtitles-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="size-4 text-primary" /> Subtitles
                    </h2>
                    {renderSRTSection()}
                    </section>
                </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-6 pt-4">
                <div className="flex flex-col gap-3 w-full max-w-md">
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={onBack}
                            className="shrink-0 rounded-xl h-12 px-5 gap-2"
                            title="Change API Key / Back"
                        >
                            <ArrowLeft className="size-5" /> Back
                        </Button>
                        <Button
                            variant="gradient"
                            onClick={handleNext}
                            disabled={activeTab === 'video' ? (!videoFile || !currentSrt) : (!(generatedAudioFile || audioFile) || !currentSrt)}
                            className="flex-1 h-12 rounded-xl gap-2 text-base font-semibold"
                            size="lg"
                        >
                            {activeTab === 'video' ? 'Enter Studio' : 'Compose Visualizer'}
                            <ArrowRight className="size-5 shrink-0" />
                        </Button>
                    </div>
                    {activeTab === 'video' && (!videoFile || !currentSrt) && (
                        <p className="text-xs text-muted-foreground text-center">
                            {!videoFile && !currentSrt ? 'Add a video and captions to continue.' : !videoFile ? 'Add a video to continue.' : 'Add captions to continue.'}
                        </p>
                    )}
                    {activeTab === 'audio' && (!(generatedAudioFile || audioFile) || !currentSrt) && (
                        <p className="text-xs text-muted-foreground text-center">
                            {!(generatedAudioFile || audioFile) && !currentSrt ? 'Add audio and captions to continue.' : !(generatedAudioFile || audioFile) ? 'Add audio to continue.' : 'Add captions to continue.'}
                        </p>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Need captions?{' '}
                    <a href="https://transcri.io/en/subtitle-generator/srt" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="size-3" /> Transcri.io
                    </a>
                    {' · '}
                    <a href="https://podcast.adobe.com/enhance" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        <Music className="size-3" /> Adobe Enhance
                    </a>
                </p>
            </div>
          </div>
      </div>

      <AppFooter />
    </div>
  );
};
