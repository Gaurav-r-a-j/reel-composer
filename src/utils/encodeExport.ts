/**
 * In-browser encode export: capture frames and mux to MP4 with FFmpeg.wasm. No recording.
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import html2canvas from "html2canvas";

const FPS = 30;
const CDN = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

export async function encodeReelToMp4(
  options: {
    captureFrame: (t: number) => Promise<HTMLCanvasElement | null>;
    videoBlob: Blob;
    duration: number;
    width: number;
    height: number;
    onProgress?: (message: string, pct: number) => void;
  }
): Promise<Blob> {
  const { captureFrame, videoBlob, duration, width, height, onProgress } = options;
  const totalFrames = Math.ceil(duration * FPS);

  onProgress?.("Capturing frames...", 0);
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const t = i / FPS;
    const canvas = await captureFrame(t);
    if (canvas) frames.push(canvas);
    if (i % 30 === 0) onProgress?.(`Frames ${i + 1}/${totalFrames}`, (i / totalFrames) * 40);
  }
  if (frames.length === 0) throw new Error("No frames captured");

  onProgress?.("Loading FFmpeg...", 45);
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CDN}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CDN}/ffmpeg-core.wasm`, "application/wasm"),
  });

  onProgress?.("Writing frames...", 50);
  const pad = (n: number) => String(n).padStart(4, "0");
  for (let i = 0; i < frames.length; i++) {
    const blob = await new Promise<Blob | null>((r) => frames[i].toBlob((b) => r(b), "image/png"));
    if (blob) await ffmpeg.writeFile(`frame_${pad(i)}.png`, new Uint8Array(await blob.arrayBuffer()));
    if (i % 30 === 0) onProgress?.(`Writing ${i + 1}/${frames.length}`, 50 + (i / frames.length) * 15);
  }

  onProgress?.("Extracting audio...", 68);
  await ffmpeg.writeFile("input.mp4", new Uint8Array(await videoBlob.arrayBuffer()));
  await ffmpeg.exec(["-i", "input.mp4", "-vn", "-acodec", "copy", "audio.aac"]).catch(() => {
    return ffmpeg.exec(["-i", "input.mp4", "-vn", "-c:a", "aac", "audio.aac"]);
  });

  onProgress?.("Encoding video...", 75);
  await ffmpeg.exec([
    "-framerate", String(FPS), "-i", "frame_%04d.png",
    "-i", "audio.aac", "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", "-y", "out.mp4",
  ]);

  onProgress?.("Finalizing...", 98);
  const data = await ffmpeg.readFile("out.mp4");
  return new Blob([data], { type: "video/mp4" });
}
