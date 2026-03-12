#!/usr/bin/env node
/**
 * Local export: Puppeteer + FFmpeg. Renders the composed reel to MP4.
 * Uses page.screenshot() per frame (no puppeteer-screen-recorder).
 * Usage: node scripts/render-reel.mjs --composition composition.json --video ./source.mp4 --output reel.mp4
 * Requires: Node 18+, Puppeteer, FFmpeg in PATH.
 */

import { createServer } from "http";
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseArgs } from "util";

const { values: opts } = parseArgs({
  options: {
    composition: { type: "string", short: "c" },
    video: { type: "string", short: "v" },
    output: { type: "string", short: "o" },
    width: { type: "string", default: "360" },
    height: { type: "string", default: "640" },
  },
  strict: true,
});

if (!opts.composition || !opts.video || !opts.output) {
  console.error("Usage: node render-reel.mjs --composition composition.json --video source.mp4 --output reel.mp4");
  process.exit(1);
}

function parseSRT(text) {
  const blocks = text.trim().replace(/\r\n/g, "\n").split("\n\n");
  const items = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    const timeLineIndex = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIndex === -1) continue;
    const [start, end] = lines[timeLineIndex].split("-->").map((s) => {
      const [h, m, s] = s.trim().replace(",", ".").split(":");
      return +h * 3600 + +m * 60 + +s;
    });
    const textLine = lines.slice(timeLineIndex + 1).join(" ");
    items.push({ id: items.length + 1, startTime: start, endTime: end, text: textLine });
  }
  return items;
}

function buildPlayerHTML(composition) {
  const { overlayHtml, layoutConfig, srtText } = composition;
  const srtData = parseSRT(srtText);
  const layoutJSON = JSON.stringify(layoutConfig);
  const srtJSON = JSON.stringify(srtData);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
  * { margin: 0; box-sizing: border-box; }
  body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  #reel { position: relative; width: ${opts.width}px; height: ${opts.height}px; overflow: hidden; background: #000; }
  #overlay { position: absolute; top: 0; left: 0; width: 100%; transition: height 0.5s ease; }
  #video-wrap { position: absolute; bottom: 0; left: 0; width: 100%; transition: height 0.5s ease; }
  #reel video { width: 100%; height: 100%; object-fit: cover; display: block; }
  #reel iframe { width: 100%; height: 100%; border: 0; pointer-events: none; }
  #caption { position: absolute; left: 50%; transform: translate(-50%, -50%); width: 90%; text-align: center; z-index: 50; color: #fff; font-size: 28px; font-weight: 800; text-shadow: 2px 2px 0 rgba(0,0,0,0.8); pointer-events: none; transition: top 0.5s ease; }
</style></head><body>
  <div id="reel">
    <div id="overlay"><iframe id="iframe" title="overlay"></iframe></div>
    <div id="video-wrap"><video id="v" src="/video" playsinline></video></div>
    <div id="caption"></div>
  </div>
  <script>
    const layoutConfig = ${layoutJSON};
    const srtData = ${srtJSON};
    const overlayHtml = ${JSON.stringify(overlayHtml)};
    const iframe = document.getElementById("iframe");
    const overlay = document.getElementById("overlay");
    const videoWrap = document.getElementById("video-wrap");
    const caption = document.getElementById("caption");
    const v = document.getElementById("v");
    iframe.srcdoc = overlayHtml;

    function getLayout(t) {
      const step = layoutConfig.find(s => t >= s.startTime && t < s.endTime);
      if (step) return step;
      if (layoutConfig.length) {
        const last = layoutConfig[layoutConfig.length - 1];
        if (t >= last.endTime) return last;
      }
      return layoutConfig[0] || { layoutMode: "split", splitRatio: 0.5, captionPosition: "bottom" };
    }
    function getCaption(t) {
      return srtData.find(s => t >= s.startTime && t <= s.endTime);
    }
    function applyLayout(t) {
      const L = getLayout(t);
      const ratio = L.splitRatio ?? 0.5;
      if (L.layoutMode === "full-video") {
        overlay.style.height = "0%";
        videoWrap.style.height = "100%";
      } else if (L.layoutMode === "full-html") {
        overlay.style.height = "100%";
        videoWrap.style.height = "0%";
      } else {
        overlay.style.height = (ratio * 100) + "%";
        videoWrap.style.height = ((1 - ratio) * 100) + "%";
      }
      if (L.captionPosition === "hidden") caption.style.display = "none";
      else {
        caption.style.display = "flex";
        caption.style.justifyContent = "center";
        caption.style.alignItems = "center";
        if (L.layoutMode === "split") caption.style.top = (ratio * 100) + "%";
        else if (L.captionPosition === "top") caption.style.top = "15%";
        else if (L.captionPosition === "center") caption.style.top = "50%";
        else caption.style.top = "80%";
      }
      const cap = getCaption(t);
      caption.textContent = cap ? cap.text : "";
      caption.style.display = cap ? "flex" : "none";
      try { iframe.contentWindow.postMessage({ type: "timeupdate", time: t }, "*"); } catch (_) {}
    }
    v.addEventListener("timeupdate", () => applyLayout(v.currentTime));
    v.addEventListener("loadedmetadata", () => applyLayout(0));
    v.addEventListener("ended", () => window.__renderDone && window.__renderDone());
    window.applyLayout = applyLayout;
  </script>
</body></html>`;
}

async function main() {
  const composition = JSON.parse(readFileSync(opts.composition, "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "reel-"));
  const playerPath = join(dir, "player.html");
  const videoDest = join(dir, "video");
  writeFileSync(playerPath, buildPlayerHTML(composition));
  cpSync(opts.video, videoDest);

  const server = createServer((req, res) => {
    const u = req.url === "/" ? "/player.html" : req.url;
    if (u === "/player.html") {
      res.setHeader("Content-Type", "text/html");
      res.end(readFileSync(playerPath));
      return;
    }
    if (u === "/video") {
      res.setHeader("Content-Type", "video/mp4");
      res.end(readFileSync(videoDest));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { default: puppeteer } = await import("puppeteer");
  const { execSync } = await import("child_process");

  const portActual = server.address().port;
  const url = `http://127.0.0.1:${portActual}/player.html`;
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: +opts.width, height: +opts.height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0" });

  await page.evaluate(() => {
    return new Promise((resolve) => {
      const v = document.querySelector("video");
      if (v.readyState >= 2) resolve();
      else v.addEventListener("loadeddata", () => resolve(), { once: true });
    });
  });

  const duration = await page.evaluate(() => document.querySelector("video").duration);
  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);
  const pad = (n) => String(n).padStart(4, "0");

  console.log(`Capturing ${totalFrames} frames at ${fps} fps...`);
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => {
      const v = document.querySelector("video");
      return new Promise((resolve) => {
        if (Math.abs(v.currentTime - time) < 0.02) {
          if (window.applyLayout) window.applyLayout(time);
          return resolve();
        }
        v.currentTime = time;
        v.addEventListener("seeked", () => {
          if (window.applyLayout) window.applyLayout(time);
          resolve();
        }, { once: true });
      });
    }, t);
    await new Promise((r) => setTimeout(r, 50));
    await page.screenshot({
      path: join(dir, `frame_${pad(i)}.png`),
      clip: { x: 0, y: 0, width: +opts.width, height: +opts.height },
    });
    if ((i + 1) % 30 === 0) console.log(`  ${i + 1}/${totalFrames}`);
  }

  await browser.close();
  server.close();

  const audioPath = join(dir, "audio.aac");
  try {
    execSync(`ffmpeg -y -i "${opts.video}" -vn -acodec copy "${audioPath}"`, { stdio: "inherit" });
  } catch {
    execSync(`ffmpeg -y -i "${opts.video}" -vn -c:a aac "${audioPath}"`, { stdio: "inherit" });
  }
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${join(dir, "frame_%04d.png")}" -i "${audioPath}" -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a copy -shortest "${opts.output}"`,
    { stdio: "inherit" }
  );
  rmSync(dir, { recursive: true });
  console.log("Wrote", opts.output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
