import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseSRT } from '@/utils/srtParser';
import { AppState, GeneratedContent, SRTItem } from '../../types';
import { generateReelContent } from '@/services/geminiService';
import { APP_CONFIG } from '../../config';
import {
  constructPrompt,
  EXAMPLE_HTML,
  EXAMPLE_JSON,
  EXAMPLE_SRT,
  EXAMPLE_TOPIC,
} from '@/utils/promptTemplates';
import { type StoredDraft } from '@/lib/draftStorage';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useMediaObjectUrls } from '@/hooks/useMediaObjectUrls';

export function useReelAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    const manualModePref = localStorage.getItem('manual_mode_opt_out');
    if (manualModePref === 'true') return AppState.UPLOAD;
    const stored = localStorage.getItem('gemini_api_key');
    return stored ? AppState.UPLOAD : AppState.WELCOME;
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [srtData, setSrtData] = useState<SRTItem[]>([]);
  const [srtTextRaw, setSrtTextRaw] = useState<string>('');
  const [topicContext, setTopicContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Prompt Copied to Clipboard!');
  const [snackbarVariant, setSnackbarVariant] = useState<'success' | 'error'>('success');

  const [showManualButton, setShowManualButton] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<GeneratedContent | null>(null);
  const isManualModeRef = useRef(false);
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('gemini_api_key') || APP_CONFIG.DEFAULT_API_KEY || ''
  );
  const [modelName, setModelName] = useState(
    () => localStorage.getItem('gemini_model_pref') || APP_CONFIG.DEFAULT_MODEL
  );

  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const [bgMusicVolume, setBgMusicVolume] = useState(0.2);
  const { videoUrl, bgMusicUrl } = useMediaObjectUrls(videoFile, bgMusicFile);

  const [subtitleFontSize, setSubtitleFontSize] = useState(32);
  const [subtitleFontFamily, setSubtitleFontFamily] = useState('Inter');
  const [subtitleColor, setSubtitleColor] = useState('#FFFFFF');
  const [subtitleBgColor, setSubtitleBgColor] = useState('rgba(0,0,0,0.8)');
  const [subtitlePaddingX, setSubtitlePaddingX] = useState(16);
  const [subtitlePaddingY, setSubtitlePaddingY] = useState(8);

  const navigate = useNavigate();

  const onRestoreDraft = useCallback((draft: StoredDraft) => {
    setGeneratedContent(draft.generatedContent);
    setSrtTextRaw(draft.srtTextRaw);
    setSrtData(parseSRT(draft.srtTextRaw));
    setTopicContext(draft.topicContext);
    setIsAudioOnly(draft.isAudioOnly);
    setSubtitleFontSize(draft.subtitleFontSize);
    setSubtitleFontFamily(draft.subtitleFontFamily);
    setSubtitleColor(draft.subtitleColor);
    setSubtitleBgColor(draft.subtitleBgColor);
    setSubtitlePaddingX(draft.subtitlePaddingX);
    setSubtitlePaddingY(draft.subtitlePaddingY);
    if (draft.videoBlob) {
      setVideoFile(
        new File([draft.videoBlob], 'restored-video.mp4', { type: draft.videoBlob.type })
      );
    } else {
      setVideoFile(null);
    }
    if (draft.audioBlob) {
      setBgMusicFile(
        new File([draft.audioBlob], 'restored-bg-music', { type: draft.audioBlob.type })
      );
    } else {
      setBgMusicFile(null);
    }
  }, []);

  const showSnackbarWithMessage = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarVariant(variant);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), variant === 'error' ? 5000 : 4000);
  }, []);

  const {
    isRestoringDraft,
    clearDraftsAndNavigate,
    resetDraftAndNavigate,
    openDraftByCode,
    listDrafts,
    deleteDraft,
  } = useDraftPersistence({
    navigate,
    appState,
    generatedContent,
    srtTextRaw,
    topicContext,
    isAudioOnly,
    subtitleFontSize,
    subtitleFontFamily,
    subtitleColor,
    subtitleBgColor,
    subtitlePaddingX,
    subtitlePaddingY,
    videoFile,
    bgMusicFile,
    onRestore: onRestoreDraft,
    setAppState,
    onDraftError: (msg) => showSnackbarWithMessage(msg, 'error'),
  });

  const saveApiKeyToStorage = useCallback(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    if (modelName) {
      localStorage.setItem('gemini_model_pref', modelName);
    }
  }, [apiKey, modelName]);

  const handleWelcomeComplete = useCallback(
    (key: string | null, model?: string, saveManualMode?: boolean) => {
      if (key) {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        if (model) {
          setModelName(model);
          localStorage.setItem('gemini_model_pref', model);
        }
      } else {
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
        if (saveManualMode) {
          localStorage.setItem('manual_mode_opt_out', 'true');
        }
      }
      setAppState(AppState.UPLOAD);
    },
    []
  );

  const handleResetAuth = useCallback(() => {
    setAppState(AppState.WELCOME);
    setGeneratedContent(null);
    setVideoFile(null);
    setSrtData([]);
    resetDraftAndNavigate();
  }, [resetDraftAndNavigate]);

  const handleFilesSelected = useCallback(
    async (video: File, srt: File, isAudioMode: boolean) => {
      try {
        setVideoFile(video);
        setIsAudioOnly(isAudioMode);
        const srtText = await srt.text();
        setSrtTextRaw(srtText);
        setSrtData(parseSRT(srtText));
        setAppState(AppState.GENERATING);
      } catch {
        setError('Failed to parse files.');
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!videoFile || srtData.length === 0) return;
    if (!apiKey.trim()) {
      setError(
        'API Key is missing. Auto-generate is disabled. Please add a key in settings or use Manual Mode.'
      );
      return;
    }
    saveApiKeyToStorage();
    setIsGenerating(true);
    setError(null);
    try {
      const content = await generateReelContent(
        srtTextRaw,
        topicContext,
        apiKey,
        modelName,
        generatedContent?.html,
        generatedContent?.layoutConfig,
        isAudioOnly
      );
      setGeneratedContent(content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate content.');
    } finally {
      setIsGenerating(false);
    }
  }, [
    videoFile,
    srtData.length,
    apiKey,
    srtTextRaw,
    topicContext,
    modelName,
    generatedContent?.html,
    generatedContent?.layoutConfig,
    isAudioOnly,
    saveApiKeyToStorage,
  ]);

  const handleManualModeEnter = useCallback(() => {
    isManualModeRef.current = true;
    setGeneratedContent({
      html: EXAMPLE_HTML,
      layoutConfig: JSON.parse(EXAMPLE_JSON),
      reasoning: 'Manual Mode Entry',
    });
    setAppState(AppState.EDITOR);
  }, []);

  const handleEnterStudio = useCallback(async () => {
    let currentSrtRaw = srtTextRaw;
    let currentTopic = topicContext;
    if (srtData.length === 0) {
      currentSrtRaw = EXAMPLE_SRT;
      currentTopic = EXAMPLE_TOPIC;
      setSrtTextRaw(currentSrtRaw);
      setSrtData(parseSRT(currentSrtRaw));
      setTopicContext(currentTopic);
    }
    const prompt = constructPrompt(currentTopic, currentSrtRaw);
    try {
      await navigator.clipboard.writeText(prompt);
      showSnackbarWithMessage('Prompt Copied to Clipboard!', 'success');
    } catch {
      /* clipboard unavailable */
    }
    if (!apiKey.trim()) {
      handleManualModeEnter();
      return;
    }
    setIsGenerating(true);
    setError(null);
    setShowManualButton(false);
    isManualModeRef.current = false;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => setShowManualButton(true), 10000);

    try {
      const content = await generateReelContent(
        currentSrtRaw,
        currentTopic,
        apiKey,
        modelName,
        undefined,
        undefined,
        isAudioOnly
      );
      if (isManualModeRef.current) {
        setPendingContent(content);
        setShowReplaceDialog(true);
      } else {
        setGeneratedContent(content);
        setAppState(AppState.EDITOR);
      }
    } catch (err: unknown) {
      console.warn('API Generation failed.', err);
      if (!isManualModeRef.current) {
        const msg = err instanceof Error ? err.message : '';
        if (msg && (msg.includes('429') || msg.includes('API Key') || msg.includes('Quota'))) {
          setError(msg);
        } else {
          try {
            setGeneratedContent({
              html: EXAMPLE_HTML,
              layoutConfig: JSON.parse(EXAMPLE_JSON),
              reasoning: "Fallback to Demo Content (API Error or Quota Exceeded)",
            });
            setAppState(AppState.EDITOR);
          } catch {
            setError(msg || 'Failed to generate initial content.');
          }
        }
      }
    } finally {
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
      setIsGenerating(false);
    }
  }, [
    srtTextRaw,
    topicContext,
    srtData.length,
    apiKey,
    modelName,
    isAudioOnly,
    handleManualModeEnter,
  ]);

  const handleConfirmReplace = useCallback(() => {
    if (pendingContent) setGeneratedContent(pendingContent);
    setShowReplaceDialog(false);
    setPendingContent(null);
  }, [pendingContent]);

  const handleCancelReplace = useCallback(() => {
    setShowReplaceDialog(false);
    setPendingContent(null);
  }, []);

  const toggleFullScreen = useCallback(() => setIsFullScreen((v) => !v), []);

  const handleNewProject = useCallback(() => {
    clearDraftsAndNavigate();
    setAppState(AppState.UPLOAD);
    setGeneratedContent(null);
    setVideoFile(null);
    setBgMusicFile(null);
    setPendingContent(null);
    setShowReplaceDialog(false);
    setIsAudioOnly(false);
  }, [clearDraftsAndNavigate]);

  return {
    appState,
    videoFile,
    videoUrl,
    isAudioOnly,
    srtData,
    srtTextRaw,
    topicContext,
    generatedContent,
    error,
    isFullScreen,
    isGenerating,
    showSnackbar,
    snackbarMessage,
    snackbarVariant,
    showManualButton,
    showReplaceDialog,
    apiKey,
    setApiKey,
    modelName,
    setModelName,
    bgMusicFile,
    bgMusicUrl,
    bgMusicVolume,
    setBgMusicVolume,
    subtitleFontSize,
    setSubtitleFontSize,
    subtitleFontFamily,
    setSubtitleFontFamily,
    subtitleColor,
    setSubtitleColor,
    subtitleBgColor,
    setSubtitleBgColor,
    subtitlePaddingX,
    setSubtitlePaddingX,
    subtitlePaddingY,
    setSubtitlePaddingY,
    isRestoringDraft,
    saveApiKeyToStorage,
    handleWelcomeComplete,
    handleResetAuth,
    handleFilesSelected,
    handleGenerate,
    handleEnterStudio,
    handleManualModeEnter,
    handleConfirmReplace,
    handleCancelReplace,
    toggleFullScreen,
    handleNewProject,
    setGeneratedContent,
    setTopicContext,
    setBgMusicFile,
    openDraftByCode,
    listDrafts,
    deleteDraft,
    showError: (msg) => showSnackbarWithMessage(msg, 'error'),
  };
}
