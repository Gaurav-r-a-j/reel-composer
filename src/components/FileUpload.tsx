
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileVideo, FileText, ArrowRight, Download, ExternalLink, Music, Wand2, Mic, Play, FileAudio, Disc, Video, Clapperboard, Sparkles, CheckSquare, Edit2, Save, X, Headphones, Trash2, ArrowLeft, BookOpen, Globe, Github, Linkedin, Instagram, Facebook } from 'lucide-react';
import { extractWavFromVideo } from '@/src/utils/audioHelpers.ts';
import { generateSRT, generateTTS } from '@/src/services/geminiService.ts';

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
        <div className={`border-2 border-dashed rounded-xl transition-all h-64 relative overflow-hidden flex flex-col ${currentSrt ? 'border-success bg-success-muted' : 'border-edge bg-surface-elevated'}`}>
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
                        <button
                            type="button"
                            onClick={handleRemoveSrt}
                            className="absolute top-2 right-2 p-1.5 bg-surface-elevated hover:bg-danger-muted hover:text-danger rounded-lg text-ink-muted transition-colors z-20 border border-edge"
                            title="Remove Captions"
                        >
                            <X size={14} />
                        </button>
                        <div className="p-3 rounded-full bg-success text-white mb-2 shadow">
                            <CheckSquare size={24} />
                        </div>
                        <p className="font-semibold text-ink text-sm max-w-[80%] truncate mb-1">{currentSrt.name}</p>
                        <p className="text-xs text-success font-mono mb-4">{(currentSrt.size / 1024).toFixed(1)} KB</p>
                        <div className="flex gap-2 z-10">
                            <button type="button" onClick={() => setIsEditingSrt(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-edge border border-edge rounded-lg text-xs text-ink transition-colors">
                                <Edit2 size={12} /> Edit
                            </button>
                            <button type="button" onClick={handleDownloadSrt} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-edge border border-edge rounded-lg text-xs text-ink transition-colors">
                                <Download size={12} /> Download
                            </button>
                        </div>
                    </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
                            <p className="text-ink-muted text-sm">Add Captions</p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                <div className="flex gap-2 w-full">
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerateSRT}
                                        disabled={!hasSource || isAutoGeneratingSRT}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-sm transition-all ${
                                            !hasSource
                                                ? 'border-edge text-ink-subtle cursor-not-allowed bg-surface-elevated'
                                                : 'border-accent bg-accent-muted text-accent hover:bg-accent hover:text-white'
                                        }`}
                                    >
                                        {isAutoGeneratingSRT ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wand2 size={16} />}
                                        {isAutoGeneratingSRT ? "Generating..." : "Auto-Generate (AI)"}
                                    </button>
                                    {isAutoGeneratingSRT && (
                                        <button
                                            type="button"
                                            onClick={handleCancelGeneration}
                                            className="p-3 rounded-xl border border-danger bg-danger-muted text-danger hover:bg-danger hover:text-white transition-colors"
                                            title="Cancel Generation"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                {!isTTSMode && (
                                    <label
                                        htmlFor="srt-upload"
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-edge bg-surface-elevated text-ink-muted transition-colors font-medium text-sm ${
                                            isAutoGeneratingSRT
                                                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                                                : 'hover:bg-edge hover:text-ink cursor-pointer'
                                        }`}
                                    >
                                        <Upload size={16} /> Upload .SRT
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col h-full w-full bg-page">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-edge bg-surface-elevated">
                        <span className="text-xs font-semibold text-ink-muted">Editing Subtitles</span>
                        <button type="button" onClick={() => setIsEditingSrt(false)} className="text-ink-muted hover:text-ink p-1 rounded"><X size={14} /></button>
                    </div>
                    <textarea
                        value={srtContent}
                        onChange={(e) => setSrtContent(e.target.value)}
                        className="flex-1 w-full bg-page p-3 text-xs font-mono text-success outline-none resize-none border-0 focus:ring-0"
                        spellCheck={false}
                    />
                    <button type="button" onClick={handleSrtSave} className="w-full py-2.5 bg-success hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-opacity">
                        <Save size={12} /> Save Changes
                    </button>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative bg-page">
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full overflow-y-auto">
          <div className="w-full max-w-5xl space-y-6 my-auto">
            <div className="text-center space-y-2 mb-6">
                <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-secondary tracking-tight leading-tight">
                  Reel Composer
                </h1>
                <p className="text-ink-muted text-base md:text-lg">
                  Create viral shorts from any media source.
                </p>
            </div>

            <div className="flex border-b border-edge w-full max-w-md mx-auto mb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 pb-3 pt-1 text-sm font-semibold text-center transition-colors relative rounded-t-lg ${
                        activeTab === 'video' ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                >
                    Video Studio
                    {activeTab === 'video' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('audio')}
                    className={`flex-1 pb-3 pt-1 text-sm font-semibold text-center transition-colors relative rounded-t-lg ${
                        activeTab === 'audio' ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                >
                    Audio Visualizer
                    {activeTab === 'audio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-secondary rounded-t-full" />}
                </button>
            </div>

            <div className="w-full bg-surface/60 border border-edge rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-lg">
                {activeTab === 'video' ? (
                // --- VIDEO UPLOAD MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                        <Clapperboard size={14} /> Source Footage
                    </h3>
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all h-64 relative overflow-hidden group ${videoFile ? 'border-accent bg-accent-muted' : 'border-edge hover:border-accent/50 bg-surface-elevated'}`}>
                        <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
                        
                        {videoFile ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
                                <button
                                    type="button"
                                    onClick={handleRemoveVideo}
                                    className="absolute top-2 right-2 p-2 bg-surface-elevated hover:bg-danger-muted hover:text-danger rounded-lg text-ink-muted transition-colors shadow border border-edge"
                                    title="Remove Video"
                                >
                                    <X size={16} />
                                </button>

                                <div className="p-4 rounded-full bg-accent text-white mb-4">
                                    <FileVideo size={32} />
                                </div>
                                <div className="text-center px-4">
                                    <p className="font-semibold text-base text-ink truncate max-w-[200px]">{videoFile.name}</p>
                                    <p className="text-xs text-ink-subtle mt-1">{(videoFile.size / (1024*1024)).toFixed(1)} MB</p>
                                </div>

                                <button type="button" onClick={handleExtractAudio} disabled={isExtracting} className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-surface/90 hover:bg-surface-elevated backdrop-blur text-xs text-ink-muted px-3 py-1.5 rounded-lg border border-edge transition-colors">
                                    {isExtracting ? <span className="animate-pulse">Processing...</span> : <><Download size={12}/> Get WAV</>}
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center space-y-4 w-full h-full justify-center z-10">
                                <div className="p-4 rounded-full bg-surface-elevated text-accent group-hover:scale-105 transition-transform duration-200">
                                    <FileVideo size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-base text-ink">Select Video</p>
                                    <p className="text-xs text-ink-subtle mt-1">MP4, MOV, WEBM</p>
                                </div>
                            </label>
                        )}
                    </div>
                    </div>

                    <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14}/> Subtitles
                    </h3>
                    {renderSRTSection()}
                    </div>
                </div>
                ) : (
                // --- AUDIO / TTS MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    <div className="space-y-4">
                        <div className="flex bg-surface-elevated p-1 rounded-lg w-fit border border-edge">
                            <button type="button" onClick={() => setAudioSourceType('upload')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${audioSourceType === 'upload' ? 'bg-edge text-ink shadow' : 'text-ink-muted hover:text-ink'}`}>Upload File</button>
                            <button type="button" onClick={() => setAudioSourceType('tts')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${audioSourceType === 'tts' ? 'bg-edge text-ink shadow' : 'text-ink-muted hover:text-ink'}`}>Text to Speech</button>
                        </div>

                        {audioSourceType === 'upload' ? (
                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all h-60 relative ${audioFile ? 'border-accent-secondary bg-accent-muted' : 'border-edge hover:border-accent-secondary/50 bg-surface-elevated'}`}>
                                <input type="file" accept="audio/*,.wav,.mp3,.m4a" onChange={handleAudioFileChange} className="hidden" id="audio-upload" />
                                
                                {audioFile ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleRemoveAudio}
                                            className="absolute top-2 right-2 p-1.5 bg-surface-elevated hover:bg-danger-muted hover:text-danger rounded-lg text-ink-muted transition-colors border border-edge z-20"
                                        >
                                            <X size={14} />
                                        </button>
                                        <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center space-y-3 w-full h-full justify-center z-10">
                                            <div className="p-4 rounded-full bg-accent-secondary text-white">
                                                <Music size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-ink truncate max-w-[200px]">{audioFile.name}</p>
                                                <p className="text-xs text-ink-subtle mt-1">{(audioFile.size / (1024*1024)).toFixed(1)} MB</p>
                                            </div>
                                        </label>
                                    </>
                                ) : (
                                    <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center space-y-3 w-full h-full justify-center">
                                        <div className="p-4 rounded-full bg-surface-elevated text-ink-muted">
                                            <Music size={28} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-ink">Drop Audio File</p>
                                            <p className="text-xs text-ink-subtle mt-1">WAV, MP3, M4A</p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="h-60 flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <button onClick={() => setTtsVoice('male')} className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${ttsVoice === 'male' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-600'}`}>Male</button>
                                    <button onClick={() => setTtsVoice('female')} className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${ttsVoice === 'female' ? 'bg-pink-600/20 border-pink-500 text-pink-300' : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-600'}`}>Female</button>
                                </div>
                                <textarea 
                                    value={ttsScript}
                                    onChange={(e) => setTtsScript(e.target.value)}
                                    placeholder="Type script here..."
                                    className="flex-1 w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:border-pink-500 outline-none resize-none text-xs leading-relaxed"
                                />
                                <button onClick={handleGenerateTTS} disabled={isGeneratingAudio || !ttsScript || !apiKey} className="w-full py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg disabled:opacity-50">
                                    {isGeneratingAudio ? "Synthesizing..." : "Generate Audio (AI)"}
                                </button>
                            </div>
                        )}

                        {/* Generated Audio Preview */}
                        {(generatedAudioFile || audioFile) && (
                            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 flex items-center gap-3 animate-fade-in relative group">
                                <div className="p-2 bg-pink-500/20 rounded-full text-pink-400">
                                    <Music size={16}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{(generatedAudioFile || audioFile)?.name}</p>
                                    <audio controls src={URL.createObjectURL(generatedAudioFile || audioFile!)} className="w-full h-6 mt-1 opacity-70 hover:opacity-100" />
                                </div>
                                <button onClick={handleDownloadAudio} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" title="Download Audio">
                                    <Download size={16}/>
                                </button>
                                
                                {/* Remove button for generated audio context specifically if needed, though handled in main view above */}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14}/> Subtitles
                    </h3>
                    {renderSRTSection()}
                    </div>
                </div>
                )}
            </div>

            <div className="flex justify-center w-full">
                <div className="flex items-center gap-4 w-full max-w-md">
                    {/* BACK BUTTON */}
                    <button
                        onClick={onBack}
                        className="w-16 h-16 rounded-full border border-gray-700 bg-gray-800/50 hover:bg-gray-700 hover:border-gray-600 hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                        title="Change API Key / Back"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* ENTER STUDIO BUTTON */}
                    <button
                        onClick={handleNext}
                        disabled={activeTab === 'video' ? (!videoFile || !currentSrt) : (!(generatedAudioFile || audioFile) || !currentSrt)}
                        className={`flex-1 group relative overflow-hidden flex items-center justify-center space-x-3 h-16 rounded-full font-black text-lg transition-all transform shadow-2xl ${
                        (activeTab === 'video' ? (videoFile && currentSrt) : ((generatedAudioFile || audioFile) && currentSrt))
                            ? 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]' 
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        <span className="relative z-10">{activeTab === 'video' ? 'Enter Studio' : 'Compose Visualizer'}</span>
                        <ArrowRight size={24} className="relative z-10" />
                    </button>
                </div>
            </div>

            <div className="flex justify-center gap-6 text-xs text-gray-500 mt-4 pb-4">
                <a href="https://transcri.io/en/subtitle-generator/srt" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <ExternalLink size={10} /> Transcri.io
                </a>
                <a href="https://podcast.adobe.com/enhance" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <Music size={10} /> Adobe Enhance
                </a>
            </div>
          </div>
      </div>

      {/* Footer - Fixed Bottom */}
      <div className="border-t border-gray-800 bg-gray-950 p-8 w-full shrink-0 z-20">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
                  <a href="https://prasannathapa.in" target="_blank">
                  <img src="https://blog.prasannathapa.in/content/images/2024/12/Picsart_24-12-18_08-13-50-070.jpg" alt="Prasanna Thapa" className="rounded-full w-full h-full object-cover bg-black" />
                  </a>
                </div>
                <div>
                  <div className="font-bold text-white text-base text-xl">Prasanna Thapa</div>
                  <div className="text-s text-gray-400 flex items-center gap-1.5">
                    Technical Architect
                    <div className="hidden md:block w-px h-4 bg-gray-700/50"></div>
                    <a href="https://zoho.com" target="_blank">
                    <img src="https://www.zohowebstatic.com/sites/default/files/zoho_general_pages/zoho-logo-white.png" alt="Zoho" className="h-5" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 items-center">
                <a href="https://blog.prasannathapa.in/reel-composer/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 hover:text-white transition-colors text-sm font-medium border border-purple-500/30">
                  <BookOpen size={14} /> The Philosophy
                </a>
                <a href="https://github.com/prasannathapa/reel-composer" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium border border-gray-700">
                  <Github size={14} /> Source Code
                </a>
                <div className="hidden md:block w-px h-4 bg-gray-700/50"></div>
                <a href="https://prasannathapa.in/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors" title="Website">
                <Globe size={20} />
                </a>
                <a href="https://github.com/prasannathapa" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" title="GitHub">
                <Github size={20} />
                </a>
                <a href="https://www.linkedin.com/in/prasannathapa" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" title="LinkedIn">
                <Linkedin size={20} />
                </a>
                <a href="https://instagram.com/prasanna_thapa" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors" title="Instagram">
                <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>
    </div>
  );
};
