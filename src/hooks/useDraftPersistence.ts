import { useEffect, useRef, useState, useCallback } from 'react';
import { type GeneratedContent, AppState } from '../../types';
import {
  getDraftByCode,
  saveDraft,
  setCurrentDraftCode,
  clearAllDrafts,
  generateDraftCode,
  listDrafts,
  deleteDraft as deleteDraftStorage,
  type StoredDraft,
} from '@/lib/draftStorage';

export interface UseDraftPersistenceArgs {
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
  /** Called when opening a draft by code fails (e.g. not found or DB error). */
  onDraftError?: (message: string) => void;
}

export function useDraftPersistence(args: UseDraftPersistenceArgs) {
  const {
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
    onDraftError,
  } = args;

  const [currentDraftCode, setCurrentDraftCodeState] = useState<string | null>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open a draft by code (from history). Only time we show "Loading draft…".
  const openDraftByCode = useCallback(
    (code: string) => {
      setIsRestoringDraft(true);
      getDraftByCode(code)
        .then((draft: StoredDraft | null) => {
          if (!draft) {
            onDraftError?.('Draft not found or no longer available.');
            return;
          }
          onRestore(draft);
          setAppState(AppState.EDITOR);
          setCurrentDraftCodeState(draft.code);
          setCurrentDraftCode(draft.code);
        })
        .catch(() => {
          onDraftError?.('Failed to load draft. Try again or start a new project.');
        })
        .finally(() => setIsRestoringDraft(false));
    },
    [onRestore, setAppState, onDraftError]
  );

  const persistAndSetDraftCode = useCallback(
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
    ]
  );

  // When we enter EDITOR, persist to IndexedDB (stay on / so refresh restores)
  useEffect(() => {
    if (
      appState !== AppState.EDITOR ||
      !generatedContent ||
      isRestoringDraft
    )
      return;
    persistAndSetDraftCode();
  }, [appState, generatedContent, isRestoringDraft, persistAndSetDraftCode]);

  // Auto-save when in editor with a draft code (debounced)
  useEffect(() => {
    if (appState !== AppState.EDITOR || !generatedContent || !currentDraftCode) return;
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
        { code: currentDraftCode, videoBlob: undefined, audioBlob: undefined }
      )
        .then(() => setCurrentDraftCode(currentDraftCode))
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
    currentDraftCode,
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
    clearDraftsAndNavigate,
    resetDraftAndNavigate,
    openDraftByCode,
    listDrafts,
    deleteDraft: deleteDraftStorage,
  };
}
