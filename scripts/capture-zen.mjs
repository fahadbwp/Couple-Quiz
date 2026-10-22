import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { generateZenLevel, ZEN_SIZE_LABELS } from "../lib/jelloo/zen.ts";
import { worlds } from "../lib/jelloo/worlds.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cssContent = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");

const size = 5;
const worldId = "snow";
const level = generateZenLevel(size, 42, worldId);
const world = worlds.find(w => w.id === worldId) || worlds[0];

const cellsHtml = level.tiles.map((tile, index) => {
  const pathTile = ["straight", "corner", "tee"].includes(tile.kind);
  const pathData = tile.kind === "straight" ? "M0 50H100" : tile.kind === "corner" ? "M50 0V50H100" : tile.kind === "tee" ? "M0 50H100M50 50V0" : "M50 50V0";
  const art = tile.kind !== "blank"
    ? `<svg aria-hidden="true" viewBox="0 0 100 100" class="pipe" style="transform: rotate(${((pathTile ? tile.rotation : tile.port ?? 0) * 90)}deg)"><path class="pipeEdge" d="${pathData}"/><path class="pipeFill" d="${pathData}"/></svg>`
    : "";
  const isGate = level.gate?.tile === index;
  const isDoor = level.door?.tile === index;
  const gateHtml = isGate ? `<span class="gateIcon">🔒</span>` : isDoor ? `<span class="gateIcon">🚪</span>` : "";
  const switchHtml = tile.terrain === "switch" ? `<span class="switchIcon">⏻</span>` : "";
  const terrainHtml = tile.terrain ? `<span class="terrainTag">${tile.terrain}</span>` : "";
  const starHtml = level.collectibles?.includes(index) ? `<span class="collectible">★</span>` : "";
  const startHtml = tile.kind === "start" ? `<span class="startMarker">START</span>` : "";
  const homeHtml = tile.kind === "home" ? `<span class="cottage">${world.homeEmoji || "🏡"}</span><span class="homeMarker">HOME</span>` : "";

  return `<div class="cell" data-connected="true" data-empty="${tile.kind === 'blank'}" data-terrain="${tile.terrain || ''}" data-gate="${isGate || isDoor ? 'closed' : ''}">
    ${art}
    ${gateHtml}
    ${switchHtml}
    ${terrainHtml}
    ${starHtml}
    ${startHtml}
    ${homeHtml}
  </div>`;
}).join("\n");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${cssContent}
body { margin: 0; padding: 16px; background: #f0f7ff; }
.shell { max-width: 520px; margin: auto; }
</style>
</head>
<body class="page compact">
  <main class="page compact" data-world="${world.id}">
    <div class="shell">
      <header class="header">
        <span class="back">← Adventure</span>
        <h1 class="brand">Jelloo<span>.</span></h1>
        <span class="sound">Sound: on</span>
      </header>
      <p class="subtitle">🌸 Zen Garden — Sukoon se khelo, koi move limit ya jaldi nahi.</p>
      
      <!-- Zen Control Bar -->
      <div style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 16px; padding: 12px 16px; margin: 12px 0 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 14px rgba(100, 116, 139, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🌸</span>
            <div>
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;">Board Size</div>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button style="padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569;">4×4</button>
                <button style="padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid #3b82f6; background: #3b82f6; color: white;">5×5</button>
                <button style="padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569;">6×6</button>
              </div>
            </div>
          </div>
          <div style="text-align: right; background: #f1f5f9; padding: 6px 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Zen Solved</div>
            <strong style="font-size: 15px; color: #0f172a;">7 puzzles</strong>
          </div>
        </div>

        <div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 4px;">Atmosphere</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button style="padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; border: 1px solid #cbd5e1; background: white; color: #334155;">🌱 Meadow</button>
            <button style="padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; border: 1px solid #cbd5e1; background: white; color: #334155;">🏖️ Beach</button>
            <button style="padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 1px solid #0284c7; background: #e0f2fe; color: #0369a1;">❄️ Snow</button>
            <button style="padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; border: 1px dashed #cbd5e1; background: #f8fafc; color: #94a3b8; opacity: 0.6;">🍭 Candy 🔒</button>
            <button style="padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; border: 1px dashed #cbd5e1; background: #f8fafc; color: #94a3b8; opacity: 0.6;">🚀 Space 🔒</button>
          </div>
        </div>
      </div>

      <section class="gamePanel">
        <div class="levelBar">
          <h2>
            <span class="worldPill">${world.name.toUpperCase()}</span>
            ${level.title} <small>· ${level.difficulty}</small>
          </h2>
          <span style="color: #64748b; font-weight: 600;"><b>0</b> moves · <span style="color: #10b981;">Unlimited</span></span>
        </div>
        <div class="boardFrame">
          <div class="board" style="--size: ${level.size};">
            ${cellsHtml}
          </div>
        </div>
        <div class="status">${level.hint}</div>
        <div class="controls">
          <button class="secondary">↶ Undo</button>
          <button class="go">Reset</button>
          <button class="secondary" style="border: 1px solid #cbd5e1;">Skip / New ↷</button>
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;

const previewPath = path.resolve("docs/jelloo/zen-preview.html");
fs.writeFileSync(previewPath, html);

const targets = [
  { out: "docs/jelloo/zen-mode-desktop.png", w: 1280, h: 880 },
  { out: "docs/jelloo/zen-mode-mobile.png", w: 390, h: 844 },
];

for (const t of targets) {
  const fileUrl = `file:///${previewPath.replace(/\\/g, "/")}`;
  const outPath = path.resolve(t.out);
  console.log(`Capturing ${t.out}...`);
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${t.w},${t.h} --screenshot="${outPath}" "${fileUrl}"`;
  execSync(cmd, { stdio: "ignore" });
}

fs.unlinkSync(previewPath);
console.log("Zen mode screenshots captured successfully!");
