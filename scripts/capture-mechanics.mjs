import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { switchFixture, slipperyFixture } from "../lib/jelloo/pals.ts";
import { ports } from "../lib/jelloo/engine.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cssContent = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");

function renderBoardHtml(level, title, subtitle) {
  const directions = ["up", "right", "down", "left"];
  const size = level.size;
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
    const homeHtml = tile.kind === "home" ? `<span class="cottage"></span><span class="homeMarker">HOME</span>` : "";

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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${cssContent}
body { margin: 0; padding: 16px; background: #fffaf3; }
.shell { max-width: 480px; margin: auto; }
</style>
</head>
<body class="page compact">
  <div class="shell">
    <header class="header">
      <span class="back">← Adventure</span>
      <h1 class="brand">Jelloo<span>.</span></h1>
      <span class="sound">Sound: on</span>
    </header>
    <p class="subtitle">${subtitle}</p>
    <section class="gamePanel">
      <div class="levelBar">
        <h2>${title}</h2>
        <span><b>0</b> moves · Take your time ♡</span>
      </div>
      <div class="boardFrame">
        <div class="board" style="--size: ${size};">
          ${cellsHtml}
        </div>
      </div>
      <div class="status">Green paths are connected. Use the mechanics to reach home!</div>
      <div class="controls">
        <button class="secondary">↶ Undo</button>
        <button class="go">Restart</button>
        <span class="starCount">★ 0/1</span>
      </div>
    </section>
  </div>
</body>
</html>`;
}

const sf = switchFixture();
const sfHtml = renderBoardHtml(sf, "Switch Mechanic Showcase", "Step on the Switch tile to unlock the Door ahead!");
const sfPath = path.resolve("docs/jelloo/switch-preview.html");
fs.writeFileSync(sfPath, sfHtml);

const slipF = slipperyFixture();
const slipHtml = renderBoardHtml(slipF, "Slippery Mechanic Showcase", "Slide straight across the ice — turning is blocked!");
const slipPath = path.resolve("docs/jelloo/slippery-preview.html");
fs.writeFileSync(slipPath, slipHtml);

const targets = [
  { html: sfPath, out: "docs/jelloo/switch-tile-desktop.png", w: 1280, h: 800 },
  { html: sfPath, out: "docs/jelloo/switch-tile-mobile.png", w: 390, h: 844 },
  { html: slipPath, out: "docs/jelloo/slippery-tile-desktop.png", w: 1280, h: 800 },
  { html: slipPath, out: "docs/jelloo/slippery-tile-mobile.png", w: 390, h: 844 },
];

for (const t of targets) {
  const fileUrl = `file:///${t.html.replace(/\\/g, "/")}`;
  const outPath = path.resolve(t.out);
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${t.w},${t.h} --screenshot="${outPath}" "${fileUrl}"`;
  console.log(`Capturing ${t.out}...`);
  execSync(cmd, { stdio: "ignore" });
}

console.log("All visual evidence screenshots captured successfully!");
