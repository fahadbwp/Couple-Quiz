import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { levelAt } from "../lib/jelloo/endless.ts";
import { worldForLevel, worlds, milestoneRewardFor } from "../lib/jelloo/worlds.ts";
import { pals } from "../lib/jelloo/pals.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cssContent = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");

function renderWorldHtml(levelId, showWorldGrid = false) {
  const level = levelAt(levelId);
  const world = worldForLevel(levelId);
  const pal = pals.find(p => p.id === (level.character ?? "bunny")) || pals[0];
  const milestone = milestoneRewardFor(levelId);

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
    const homeIcon = world.homeEmoji || "🏡";
    const homeHtml = tile.kind === "home" ? `<span class="cottage">${homeIcon}</span><span class="homeMarker">HOME</span>` : "";

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

  const worldGridHtml = showWorldGrid ? `
    <div class="worldGrid" style="margin: 16px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
      ${worlds.map(w => `
        <div class="worldCard" data-active="${w.id === world.id}" data-unlocked="true" style="padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.8); border: 2px solid ${w.id === world.id ? '#ec4899' : '#e2e8f0'}; text-align: center;">
          <div style="font-size: 24px;">${w.badge.split(' ')[0]}</div>
          <strong style="display: block; font-size: 13px;">${w.name}</strong>
          <small style="color: #64748b; font-size: 11px;">Levels ${w.minLevel}–${w.maxLevel}</small>
        </div>
      `).join("")}
    </div>
  ` : "";

  const milestoneBannerHtml = milestone ? `
    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; text-align: center;">
      <span style="font-size: 18px; margin-right: 6px;">${milestone.badge}</span>
      <strong>Milestone Level: ${milestone.reward}</strong>
      <div style="font-size: 12px; color: #92400e; margin-top: 2px;">${milestone.description}</div>
    </div>
  ` : "";

  return `<!DOCTYPE html>
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
  <main class="page compact" data-world="${world.id}">
    <div class="shell">
      <header class="header">
        <span class="back">← Adventure</span>
        <h1 class="brand">Jelloo<span>.</span></h1>
        <span class="sound">Sound: on</span>
      </header>
      <p class="subtitle">Tiles ghumao, raasta jodo — ${pal.name} in ${world.name}!</p>
      ${milestoneBannerHtml}
      <section class="gamePanel">
        <div class="levelBar">
          <h2>
            <span class="worldPill">${world.badge}</span>
            Level ${level.id} <small>· ${level.difficulty}</small>
          </h2>
          <span><b>0</b> moves · Take your time ♡</span>
        </div>
        <div class="boardFrame">
          <div class="board" style="--size: ${level.size};">
            ${cellsHtml}
          </div>
        </div>
        ${worldGridHtml}
        <div class="status">${world.description} — Connecting home to ${world.homeEmoji || "🏡"}</div>
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
}

// Generate HTMLs for the 5 worlds
const worldLevels = [
  { id: 10, name: "world-1-meadow", showGrid: true },
  { id: 25, name: "world-2-beach", showGrid: false },
  { id: 45, name: "world-3-snow", showGrid: false },
  { id: 65, name: "world-4-candy", showGrid: false },
  { id: 85, name: "world-5-space", showGrid: false },
];

const targets = [];
for (const wl of worldLevels) {
  const html = renderWorldHtml(wl.id, wl.showGrid);
  const filePath = path.resolve(`docs/jelloo/${wl.name}-preview.html`);
  fs.writeFileSync(filePath, html);
  targets.push({ html: filePath, out: `docs/jelloo/${wl.name}-desktop.png`, w: 1280, h: 880 });
  targets.push({ html: filePath, out: `docs/jelloo/${wl.name}-mobile.png`, w: 390, h: 844 });
}

for (const t of targets) {
  const fileUrl = `file:///${t.html.replace(/\\/g, "/")}`;
  const outPath = path.resolve(t.out);
  console.log(`Capturing ${t.out}...`);
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${t.w},${t.h} --screenshot="${outPath}" "${fileUrl}"`;
  execSync(cmd, { stdio: "ignore" });
}

console.log("All 5 world desktop and mobile screenshots captured successfully!");
