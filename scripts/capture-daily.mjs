import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { currentUtcDateString, generateDailyLevel, getDailyMeta } from "../lib/jelloo/daily.ts";
import { worldForLevel } from "../lib/jelloo/worlds.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cssContent = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");

const todayUtc = currentUtcDateString();
const meta = getDailyMeta(todayUtc);
const level = generateDailyLevel(todayUtc);
const world = worldForLevel(level.id);

const cellsHtml = level.tiles.map((tile, index) => {
  const pathTile = ["straight", "corner", "tee"].includes(tile.kind);
  const path = tile.kind === "straight" ? "M0 50H100" : tile.kind === "corner" ? "M50 0V50H100" : tile.kind === "tee" ? "M0 50H100M50 50V0" : "M50 50V0";
  const art = tile.kind !== "blank"
    ? `<svg aria-hidden="true" viewBox="0 0 100 100" class="pipe" style="transform: rotate(${((pathTile ? tile.rotation : tile.port ?? 0) * 90)}deg)"><path class="pipeEdge" d="${path}"/><path class="pipeFill" d="${path}"/></svg>`
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
body { margin: 0; padding: 16px; background: #fffaf3; }
.shell { max-width: 520px; margin: auto; }
</style>
</head>
<body class="page compact">
  <main class="page compact" data-world="${meta.world}">
    <div class="shell">
      <header class="header">
        <span class="back">← Adventure</span>
        <h1 class="brand">Jelloo<span>.</span></h1>
        <span class="sound">Sound: on</span>
      </header>
      <p class="subtitle">Tiles ghumao, raasta jodo — ${meta.character} in today's ${meta.world} Daily!</p>
      
      <div style="background: linear-gradient(135deg, rgba(254, 243, 199, 0.9), rgba(253, 230, 138, 0.9)); border: 1px solid #f59e0b; border-radius: 16px; padding: 12px 16px; margin: 12px 0 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #b45309">
            UTC Calendar Challenge · ${meta.weekdayName}
          </div>
          <strong style="font-size: 15px; color: #78350f">
            ${level.title}
          </strong>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.8); padding: 6px 12px; border-radius: 12px; border: 1px solid #fde68a">
          <span style="font-size: 20px;">🔥</span>
          <div>
            <div style="font-size: 13px; fontWeight: 900; color: #92400e;">
              3 Days Streak
            </div>
            <small style="font-size: 10px; color: #b45309;">
              Best: 5 · Ready to play!
            </small>
          </div>
        </div>
      </div>

      <section class="gamePanel">
        <div class="levelBar">
          <h2>
            <span class="worldPill">${meta.world.toUpperCase()}</span>
            ${level.title} <small>· ${level.difficulty}</small>
          </h2>
          <span><b>0</b> moves · / limit ${level.moveLimit}</span>
        </div>
        <div class="boardFrame">
          <div class="board" style="--size: ${level.size};">
            ${cellsHtml}
          </div>
        </div>
        <div class="status">${level.hint}</div>
        <div class="controls">
          <button class="secondary">↶ Undo</button>
          <button class="go">Restart</button>
          <span class="starCount">★ 0/${level.collectibles?.length || 1}</span>
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;

const previewPath = path.resolve("docs/jelloo/daily-preview.html");
fs.writeFileSync(previewPath, html);

const targets = [
  { out: "docs/jelloo/daily-puzzle-desktop.png", w: 1280, h: 880 },
  { out: "docs/jelloo/daily-puzzle-mobile.png", w: 390, h: 844 },
];

for (const t of targets) {
  const fileUrl = `file:///${previewPath.replace(/\\/g, "/")}`;
  const outPath = path.resolve(t.out);
  console.log(`Capturing ${t.out}...`);
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${t.w},${t.h} --screenshot="${outPath}" "${fileUrl}"`;
  execSync(cmd, { stdio: "ignore" });
}

fs.unlinkSync(previewPath);
console.log("Daily puzzle screenshots captured successfully!");
