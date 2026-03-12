import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileVideo, FileText, ArrowRight, Download, ExternalLink, Music, Wand2, Mic, Play, FileAudio, Disc, Video, Clapperboard, Sparkles, CheckSquare, Edit2, Save, X, Headphones, Trash2, ArrowLeft } from 'lucide-react';
import { extractWavFromVideo } from '@/utils/audioHelpers';
import { generateSRT, generateTTS } from '@/services/geminiService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

  // Reusable SRT Card Component
  const renderSRTSection = () => {
    // Logic to disable upload button for TTS mode
    const isTTSMode = activeTab === 'audio' && audioSourceType === 'tts';
    // Logic to enable auto-generate: Need source file
    const hasSource = activeTab === 'video' ? !!videoFile : (!!audioFile || !!generatedAudioFile);

    return (
        <div className={`border-2 border-dashed rounded-xl transition-all h-64 relative overflow-hidden flex flex-col ${currentSrt ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}>
            {!isEditingSrt ? (
                <>
                    <input 
                    type="file" 
                    accept=".srt" 
                    onChange={handleSrtChange} 
                    className="hidden" 
                    id="srt-upload" 
                    disabled={isAutoGeneratingSRT || isTTSMode} // Disable upload in TTS mode as requested
                    />
                    
                    {currentSrt ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={handleRemoveSrt}
                            className="absolute top-2 right-2 z-20"
                            title="Remove Captions"
                        >
                            <X size={14} />
                        </Button>
                        <div className="p-3 rounded-full bg-primary text-primary-foreground mb-2 shadow">
                            <CheckSquare size={24} />
                        </div>
                        <p className="font-semibold text-foreground text-sm max-w-[80%] truncate mb-1">{currentSrt.name}</p>
                        <p className="text-xs text-primary font-mono mb-4">{(currentSrt.size / 1024).toFixed(1)} KB</p>
                        <div className="flex gap-2 z-10">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingSrt(true)}>
                                <Edit2 size={12} /> Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleDownloadSrt}>
                                <Download size={12} /> Download
                            </Button>
                        </div>
                    </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
                            <p className="text-muted-foreground text-sm">Add Captions</p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                <div className="flex gap-2 w-full">
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={handleAutoGenerateSRT}
                                        disabled={!hasSource || isAutoGeneratingSRT}
                                        className="flex-1"
                                    >
                                        {isAutoGeneratingSRT ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wand2 size={16} />}
                                        {isAutoGeneratingSRT ? "Generating..." : "Auto-Generate (AI)"}
                                    </Button>
                                    {isAutoGeneratingSRT && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={handleCancelGeneration}
                                            title="Cancel Generation"
                                        >
                                            <X size={16} />
                                        </Button>
                                    )}
                                </div>
                                {!isTTSMode && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isAutoGeneratingSRT}
                                        className="w-full"
                                        onClick={() => document.getElementById('srt-upload')?.click()}
                                    >
                                        <Upload size={16} /> Upload .SRT
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                    <div className="flex flex-col h-full w-full bg-background">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
                        <span className="text-xs font-semibold text-muted-foreground">Editing Subtitles</span>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => setIsEditingSrt(false)}><X size={14} /></Button>
                    </div>
                    <Textarea
                        value={srtContent}
                        onChange={(e) => setSrtContent(e.target.value)}
                        className="flex-1 w-full min-h-0 resize-none"
                        spellCheck={false}
                    />
                    <Button type="button" onClick={handleSrtSave} className="w-full">
                        <Save size={12} /> Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative bg-background">
      <div className="absolute top-4 right-4 z-100">
        <ModeToggle />
      </div>
      <div className="flex-1 flex flex-col w-full overflow-y-auto">
          <div className="container space-y-6 my-auto py-6">
            <section className="text-center space-y-2 pb-4" aria-label="Title">
              <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight leading-tight text-foreground">
                Reel Composer
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Create viral shorts from any media source.
              </p>
            </section>

            <div className="flex w-full max-w-md mx-auto rounded-full bg-muted/40 p-1 shadow-sm">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('video')}
                    className="flex-1 relative rounded-t-lg gap-2 py-2.5"
                >
                    Video Studio
                    {activeTab === 'video' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('audio')}
                    className="flex-1 relative rounded-t-lg gap-2 py-2.5"
                >
                    Audio Visualizer
                    {activeTab === 'audio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                </Button>
            </div>

            <div className="w-full bg-card rounded-2xl overflow-hidden shadow-sm">
                {activeTab === 'video' ? (
                // --- VIDEO UPLOAD MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <section className="p-6 md:p-6 space-y-3" aria-labelledby="source-heading">
                    <h3 id="source-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clapperboard size={14} /> Source Footage
                    </h3>
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all h-64 relative overflow-hidden group ${videoFile ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-muted'}`}>
                        <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
                        
                        {videoFile ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={handleRemoveVideo}
                                    className="absolute top-2 right-2"
                                    title="Remove Video"
                                >
                                    <X size={16} />
                                </Button>

                                <div className="p-4 rounded-full bg-primary text-primary-foreground mb-4">
                                    <FileVideo size={32} />
                                </div>
                                <div className="text-center px-4">
                                    <p className="font-semibold text-base text-foreground truncate max-w-[200px]">{videoFile.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{(videoFile.size / (1024*1024)).toFixed(1)} MB</p>
                                </div>

                                <Button type="button" variant="outline" size="sm" onClick={handleExtractAudio} disabled={isExtracting} className="absolute bottom-4 right-4 z-20">
                                    {isExtracting ? <span className="animate-pulse">Processing...</span> : <><Download size={12}/> Get WAV</>}
                                </Button>
                            </div>
                        ) : (
                            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center space-y-4 w-full h-full justify-center z-10">
                                <div className="p-4 rounded-full bg-muted text-primary group-hover:scale-105 transition-transform duration-200">
                                    <FileVideo size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-base text-foreground">Select Video</p>
                                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WEBM</p>
                                </div>
                            </label>
                        )}
                    </div>
                    </section>

                    <section className="p-6 md:p-6 space-y-3 border-t border-border md:border-t-0 md:border-l" aria-labelledby="subtitles-heading">
                    <h3 id="subtitles-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14}/> Subtitles
                    </h3>
                    {renderSRTSection()}
                    </section>
                </div>
                ) : (
                // --- AUDIO / TTS MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <section className="p-6 md:p-6 space-y-4" aria-labelledby="audio-source-heading">
                        <h3 id="audio-source-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Music size={14} /> Audio Source
                        </h3>
                        <div className="flex p-1 rounded-lg w-fit border border-border bg-muted/30">
                            <Button type="button" variant={audioSourceType === 'upload' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAudioSourceType('upload')}>
                                Upload File
                            </Button>
                            <Button type="button" variant={audioSourceType === 'tts' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAudioSourceType('tts')}>
                                Text to Speech
                            </Button>
                        </div>

                        {audioSourceType === 'upload' ? (
                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all h-60 relative ${audioFile ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50 bg-muted'}`}>
                                <input type="file" accept="audio/*,.wav,.mp3,.m4a" onChange={handleAudioFileChange} className="hidden" id="audio-upload" />
                                
                                {audioFile ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-xs"
                                            onClick={handleRemoveAudio}
                                            className="absolute top-2 right-2 z-20"
                                        >
                                            <X size={14} />
                                        </Button>
                                        <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center space-y-3 w-full h-full justify-center z-10">
                                            <div className="p-4 rounded-full bg-secondary text-secondary-foreground">
                                                <Music size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground truncate max-w-[200px]">{audioFile.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{(audioFile.size / (1024*1024)).toFixed(1)} MB</p>
                                            </div>
                                        </label>
                                    </>
                                ) : (
                                    <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center space-y-3 w-full h-full justify-center">
                                        <div className="p-4 rounded-full bg-muted text-muted-foreground">
                                            <Music size={28} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-foreground">Drop Audio File</p>
                                            <p className="text-xs text-muted-foreground mt-1">WAV, MP3, M4A</p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="h-60 flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Button variant={ttsVoice === 'male' ? 'secondary' : 'outline'} size="sm" onClick={() => setTtsVoice('male')} className="flex-1">
                                        Male
                                    </Button>
                                    <Button variant={ttsVoice === 'female' ? 'secondary' : 'outline'} size="sm" onClick={() => setTtsVoice('female')} className="flex-1">
                                        Female
                                    </Button>
                                </div>
                                <Textarea
                                    value={ttsScript}
                                    onChange={(e) => setTtsScript(e.target.value)}
                                    placeholder="Type script here..."
                                    className="flex-1 min-h-0 w-full resize-none"
                                />
                                <Button onClick={handleGenerateTTS} disabled={isGeneratingAudio || !ttsScript || !apiKey} className="w-full">
                                    {isGeneratingAudio ? "Synthesizing..." : "Generate Audio (AI)"}
                                </Button>
                            </div>
                        )}

                        {/* Generated Audio Preview */}
                        {(generatedAudioFile || audioFile) && (
                            <div className="bg-muted/50 rounded-xl p-3 border border-border flex items-center gap-3 animate-fade-in relative group">
                                <div className="p-2 bg-primary/20 rounded-full text-primary">
                                    <Music size={16}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">{(generatedAudioFile || audioFile)?.name}</p>
                                    <audio controls src={URL.createObjectURL(generatedAudioFile || audioFile!)} className="w-full h-6 mt-1 opacity-70 hover:opacity-100" />
                                </div>
                                <Button variant="ghost" size="icon-sm" onClick={handleDownloadAudio} title="Download Audio">
                                    <Download size={16}/>
                                </Button>
                                
                                {/* Remove button for generated audio context specifically if needed, though handled in main view above */}
                            </div>
                        )}
                    </section>

                    <section className="p-6 md:p-6 space-y-3 border-t border-border md:border-t-0 md:border-l" aria-labelledby="audio-subtitles-heading">
                    <h3 id="audio-subtitles-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14}/> Subtitles
                    </h3>
                    {renderSRTSection()}
                    </section>
                </div>
                )}
            </div>

            <div className="flex justify-center w-full">
                <div className="flex items-center gap-4 w-full max-w-md mx-auto">
                    {/* BACK BUTTON */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={onBack}
                        className="w-16 h-16 rounded-full"
                        title="Change API Key / Back"
                    >
                        <ArrowLeft size={24} />
                    </Button>

                    {/* ENTER STUDIO BUTTON */}
                    <Button
                        onClick={handleNext}
                        disabled={activeTab === 'video' ? (!videoFile || !currentSrt) : (!(generatedAudioFile || audioFile) || !currentSrt)}
                        className="flex-1 h-16 rounded-full gap-3 text-lg font-black"
                        size="lg"
                    >
                        {activeTab === 'video' ? 'Enter Studio' : 'Compose Visualizer'}
                        <ArrowRight size={24} className="shrink-0" />
                    </Button>
                </div>
            </div>

            <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-4 pb-4">
                <a href="https://transcri.io/en/subtitle-generator/srt" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                    <ExternalLink size={10} /> Transcri.io
                </a>
                <a href="https://podcast.adobe.com/enhance" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Music size={10} /> Adobe Enhance
                </a>
            </div>
          </div>
      </div>

      <AppFooter />
    </div>
  );
};
