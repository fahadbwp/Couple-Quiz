import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { formatShareCard } from "../lib/jelloo/share.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cssContent = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");

const shareInput = {
  mode: "daily",
  levelId: -1,
  dailyDate: "2026-10-22",
  weekdayName: "Thursday",
  moves: 14,
  moveLimit: 17,
  stars: 3,
  collectedStars: 2,
  totalStars: 2,
  character: "panda",
  world: "beach",
  streak: 4,
  size: 5,
  path: [0, 1, 2, 7, 12, 17, 22, 23, 24],
};

const card = formatShareCard(shareInput);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${cssContent}
body { margin: 0; padding: 20px; background: rgba(53, 34, 61, 0.4); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.cardModal {
  border: 1px solid #eed5e3;
  background: #fff9fc;
  border-radius: 26px;
  color: #634363;
  width: min(380px, 92vw);
  padding: 30px 22px 24px;
  text-align: center;
  box-shadow: 0 20px 80px rgba(85, 48, 71, 0.35);
}
</style>
</head>
<body>
  <div class="cardModal">
    <h3 style="font-size: 22px; font-weight: 900; margin: 0 0 10px;">🎉 Daily Puzzle Solved!</h3>
    <div style="font-size: 28px; color: #f59e0b; margin-bottom: 8px;">★★★</div>
    <p style="font-size: 13px; margin: 4px 0 12px; color: #70586a;">14 moves · 2/2 golden stars · Streak: 🔥 4 days</p>

    <div style="margin: 14px 0 10px; padding: 12px 14px; background: rgba(255, 255, 255, 0.85); border: 1px dashed #c084fc; border-radius: 16px; text-align: center;">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin-bottom: 4px;">
        Share Your Result
      </div>
      <pre style="margin: 6px auto 10px; padding: 8px 10px; background: rgba(243, 232, 255, 0.6); border: 1px solid #e9d5ff; border-radius: 10px; font-size: 12px; line-height: 1.3; color: #4c1d95; font-family: monospace; white-space: pre-wrap; max-width: 280px;">${card.fullMessage.split("\n\nPlay")[0]}</pre>
      <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
        <button type="button" style="padding: 8px 12px; background: #9333ea; color: white; border: none; border-radius: 10px; font-size: 12px; font-weight: bold;">
          📋 Copy Card
        </button>
        <button type="button" style="padding: 8px 12px; background: #25d366; color: white; border: none; border-radius: 10px; font-size: 12px; font-weight: bold;">
          💬 WhatsApp
        </button>
        <button type="button" style="padding: 8px 12px; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; border-radius: 10px; font-size: 12px; font-weight: bold;">
          ↗ Share
        </button>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 14px;">
      <button style="flex: 1; padding: 10px; border-radius: 12px; background: #fffdf2; color: #536843; border: 1px solid #cad5b6; font-weight: bold;">Try again</button>
      <button style="flex: 1.5; padding: 10px; border-radius: 12px; background: #7352a5; color: white; border: 1px solid #62478e; font-weight: bold;">Back to Adventure →</button>
    </div>
  </div>
</body>
</html>`;

const previewPath = path.resolve("docs/jelloo/share-preview.html");
fs.writeFileSync(previewPath, html);

const targets = [
  { out: "docs/jelloo/share-card-desktop.png", w: 1280, h: 800 },
  { out: "docs/jelloo/share-card-mobile.png", w: 390, h: 844 },
];

for (const t of targets) {
  const fileUrl = `file:///${previewPath.replace(/\\/g, "/")}`;
  const outPath = path.resolve(t.out);
  console.log(`Capturing ${t.out}...`);
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${t.w},${t.h} --screenshot="${outPath}" "${fileUrl}"`;
  execSync(cmd, { stdio: "ignore" });
}

fs.unlinkSync(previewPath);
console.log("Share card screenshots captured successfully!");
