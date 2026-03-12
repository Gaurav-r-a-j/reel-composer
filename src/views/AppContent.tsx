import React from 'react';
import { FileUpload } from '@/components/screens/FileUpload';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { AppHeader } from '@/components/layout/AppHeader';
import { GeneratingScreen } from '@/components/screens/GeneratingScreen';
import { EditorView } from '@/views/EditorView';
import { Snackbar } from '@/components/feedback/Snackbar';
import { ReplaceSceneDialog } from '@/components/dialogs/ReplaceSceneDialog';
import { AppState } from '../../types';
import { useReelAppState } from '@/hooks/useReelAppState';

export const AppContent: React.FC = () => {
  const state = useReelAppState();

  if (state.isRestoringDraft) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading draft…</p>
      </div>
    );
  }

  if (state.appState === AppState.WELCOME) {
    return (
      <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-background">
        <WelcomeScreen onComplete={state.handleWelcomeComplete} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      {!state.isFullScreen && state.appState !== AppState.UPLOAD && (
        <AppHeader
          onResetAuth={state.handleResetAuth}
          onNewProject={state.handleNewProject}
        />
      )}

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {state.appState === AppState.UPLOAD && (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-1">
              <FileUpload
                onFilesSelected={state.handleFilesSelected}
                apiKey={state.apiKey}
                onBack={state.handleResetAuth}
              />
            </div>
          </div>
        )}

        {state.appState === AppState.GENERATING && (
          <GeneratingScreen
            isAudioOnly={state.isAudioOnly}
            topicContext={state.topicContext}
            onTopicContextChange={state.setTopicContext}
            isGenerating={state.isGenerating}
            showManualButton={state.showManualButton}
            error={state.error}
            onEnterStudio={state.handleEnterStudio}
            onManualModeEnter={state.handleManualModeEnter}
            onResetAuth={state.handleResetAuth}
            apiKey={state.apiKey}
            srtDataLength={state.srtData.length}
          />
        )}

        {state.appState === AppState.EDITOR && state.generatedContent && (
          <EditorView
            videoUrl={state.videoUrl}
            srtData={state.srtData}
            generatedContent={state.generatedContent}
            isFullScreen={state.isFullScreen}
            toggleFullScreen={state.toggleFullScreen}
            bgMusicUrl={state.bgMusicUrl}
            bgMusicVolume={state.bgMusicVolume}
            isGenerating={state.isGenerating}
            onGenerate={state.handleGenerate}
            onUpdate={state.setGeneratedContent}
            videoFile={state.videoFile}
            topicContext={state.topicContext}
            onTopicContextChange={state.setTopicContext}
            srtText={state.srtTextRaw}
            bgMusicName={state.bgMusicFile?.name}
            onBgMusicChange={state.setBgMusicFile}
            onBgVolumeChange={state.setBgMusicVolume}
            apiKey={state.apiKey}
            setApiKey={state.setApiKey}
            modelName={state.modelName}
            setModelName={state.setModelName}
            onSaveApiKey={state.saveApiKeyToStorage}
            subtitleFontSize={state.subtitleFontSize}
            onSubtitleFontSizeChange={state.setSubtitleFontSize}
            subtitleFontFamily={state.subtitleFontFamily}
            onSubtitleFontFamilyChange={state.setSubtitleFontFamily}
            subtitleColor={state.subtitleColor}
            onSubtitleColorChange={state.setSubtitleColor}
            subtitleBgColor={state.subtitleBgColor}
            onSubtitleBgColorChange={state.setSubtitleBgColor}
            subtitlePaddingX={state.subtitlePaddingX}
            onSubtitlePaddingXChange={state.setSubtitlePaddingX}
            subtitlePaddingY={state.subtitlePaddingY}
            onSubtitlePaddingYChange={state.setSubtitlePaddingY}
          />
        )}
      </main>

      <Snackbar
        show={state.showSnackbar}
        message="Prompt Copied to Clipboard!"
      />

      <ReplaceSceneDialog
        show={state.showReplaceDialog}
        onConfirm={state.handleConfirmReplace}
        onCancel={state.handleCancelReplace}
      />
    </div>
  );
};
