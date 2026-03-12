import { useEffect, useState } from 'react';

// Returns object URLs for a video file and an optional bg music file; revokes on cleanup.
export function useMediaObjectUrls(
  videoFile: File | null,
  bgMusicFile: File | null
): { videoUrl: string; bgMusicUrl: string | undefined } {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [bgMusicUrl, setBgMusicUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl('');
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    if (!bgMusicFile) {
      setBgMusicUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(bgMusicFile);
    setBgMusicUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bgMusicFile]);

  return { videoUrl, bgMusicUrl };
}
