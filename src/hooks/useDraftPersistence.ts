import { useEffect, useRef, useState, useCallback } from 'react';
import { type GeneratedContent, AppState } from '../../types';
import {
  getDraftByCode,
  saveDraft,
  setCurrentDraftCode,
  clearAllDrafts,
  generateDraftCode,
  type StoredDraft,
} from '@/lib/draftStorage';
import { draftUrl } from '@/routes';

export interface UseDraftPersistenceArgs {
  draftCodeFromUrl: string | undefined;
  navigate: (path: string, opts?: { replace?: boolean }) => void;
  appState: AppState;
  generatedContent: GeneratedContent | null;
  srtTextRaw: string;
  topicContext: string;
  isAudioOnly: boolean;
  subtitleFontSize: number;
  subtitleFontFamily: string;
  subtitleColor: string;
  subtitleBgColor: string;
  subtitlePaddingX: number;
  subtitlePaddingY: number;
  videoFile: File | null;
  bgMusicFile: File | null;
  onRestore: (draft: StoredDraft) => void;
  setAppState: (s: AppState) => void;
}

export function useDraftPersistence(args: UseDraftPersistenceArgs) {
  const {
    draftCodeFromUrl,
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
    onRestore,
    setAppState,
  } = args;

  const [currentDraftCode, setCurrentDraftCodeState] = useState<string | null>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft from URL when route is /draft/:code
  useEffect(() => {
    if (!draftCodeFromUrl) return;
    let cancelled = false;
    setIsRestoringDraft(true);
    getDraftByCode(draftCodeFromUrl)
      .then((draft: StoredDraft | null) => {
        if (cancelled) return;
        if (!draft) {
          navigate('/', { replace: true });
          return;
        }
        onRestore(draft);
        setAppState(AppState.EDITOR);
        setCurrentDraftCodeState(draftCodeFromUrl);
        setCurrentDraftCode(draftCodeFromUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsRestoringDraft(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftCodeFromUrl, navigate, onRestore, setAppState]);

  const persistAndSetDraftUrl = useCallback(
    async (code?: string) => {
      if (!generatedContent) return;
      const newCode = code ?? currentDraftCode ?? generateDraftCode();
      await saveDraft(
        {
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
        },
        {
          code: newCode,
          videoBlob: videoFile ?? undefined,
          audioBlob: bgMusicFile ?? undefined,
        }
      );
      setCurrentDraftCodeState(newCode);
      setCurrentDraftCode(newCode);
      navigate(draftUrl(newCode), { replace: true });
    },
    [
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
      currentDraftCode,
      navigate,
    ]
  );

  // When we enter EDITOR without a draft URL, persist and update URL
  useEffect(() => {
    if (
      appState !== AppState.EDITOR ||
      !generatedContent ||
      draftCodeFromUrl ||
      isRestoringDraft
    )
      return;
    persistAndSetDraftUrl();
  }, [appState, generatedContent, draftCodeFromUrl, isRestoringDraft, persistAndSetDraftUrl]);

  // Auto-save when in editor with a draft code (debounced)
  useEffect(() => {
    if (appState !== AppState.EDITOR || !generatedContent || !draftCodeFromUrl) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveDraft(
        {
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
        },
        { code: draftCodeFromUrl, videoBlob: undefined, audioBlob: undefined }
      )
        .then(() => setCurrentDraftCode(draftCodeFromUrl))
        .catch(() => {});
      autoSaveRef.current = null;
    }, 3000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [
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
    draftCodeFromUrl,
  ]);

  const clearDraftsAndNavigate = useCallback(() => {
    clearAllDrafts().catch(() => {});
    setCurrentDraftCodeState(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const resetDraftAndNavigate = useCallback(() => {
    setCurrentDraftCodeState(null);
    navigate('/', { replace: true });
  }, [navigate]);

  return {
    isRestoringDraft,
    currentDraftCode,
    setCurrentDraftCodeState,
    persistAndSetDraftUrl,
    clearDraftsAndNavigate,
    resetDraftAndNavigate,
  };
}
