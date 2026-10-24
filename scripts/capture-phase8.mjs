import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { worlds, worldForLevel } from "../lib/jelloo/worlds.ts";
import { switchFixture, playablePowerTrial } from "../lib/jelloo/pals.ts";
import { walkPowerLevel } from "../lib/jelloo/power-solver.ts";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const gameCss = fs.readFileSync(path.resolve("app/jelloo/game.module.css"), "utf8");
const mapCss = fs.readFileSync(path.resolve("app/jelloo/map/map.module.css"), "utf8");

// 1. Generate HTML for Adventure Level Map at Level 27 (player completed 26)
function generateLevelMapHtml(completed = 26) {
  const levelsByWorld = worlds.map((world) => {
    const cells = [];
    for (let id = world.startLevel; id <= world.endLevel; id++) {
      let status = "locked";
      let stars = 0;
      if (id <= completed) {
        status = "completed";
        stars = 3;
      } else if (id === completed + 1) {
        status = "current";
      }
      const isPlayable = status !== "locked" && completed >= world.unlockLevel;
      if (!isPlayable) {
        cells.push(`<div class="cell" data-status="locked"><span class="levelNum">${id}</span><span class="lockIcon">🔒</span></div>`);
      } else {
        const starHtml = status === "completed" ? `<span class="stars"><span data-earned="true">★</span><span data-earned="true">★</span><span data-earned="true">★</span></span>` : "";
        const badgeHtml = status === "current" ? `<span class="currentBadge">▶</span>` : "";
        cells.push(`<div class="cell" data-status="${status}"><span class="levelNum">${id}</span>${starHtml}${badgeHtml}</div>`);
      }
    }
    return `
      <section class="worldSection" data-world="${world.id}">
        <div class="worldHeader">
          <span class="worldIcon">${world.icon}</span>
          <div class="worldMeta">
            <h3 class="worldName">${world.name}</h3>
            <span class="worldRange">Levels ${world.startLevel}–${world.endLevel} · ${idRangeDone(world, completed)}/20 done</span>
          </div>
        </div>
        <div class="levelGrid">${cells.join("\n")}</div>
      </section>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${mapCss}
body { margin: 0; background: #fffaf3; font-family: "Trebuchet MS", system-ui, sans-serif; }
</style>
</head>
<body class="page">
  <div class="shell">
    <header class="header">
      <span class="back">← Adventure</span>
      <h1 class="brand">Jelloo<span>.</span></h1>
      <span class="homeLink">PlayNudge Home</span>
    </header>
    <div class="titleRow">
      <h2 class="title">🗺️ Adventure Map</h2>
      <span class="progress">${completed}/100 completed</span>
    </div>
    ${levelsByWorld}
  </div>
</body>
</html>`;
}

function idRangeDone(world, completed) {
  if (completed < world.startLevel) return 0;
  if (completed >= world.endLevel) return 20;
  return completed - world.startLevel + 1;
}

// 2. Generate Out of Moves Modal HTML
function generateOutOfMovesHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${gameCss}
body { margin: 0; padding: 20px; background: #fdf0f4; font-family: "Trebuchet MS", system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.modalCard {
  border: 1px solid #eed5e3;
  background: #fff9fc;
  border-radius: 26px;
  color: #634363;
  width: min(380px, 92vw);
  padding: 34px 24px 28px;
  text-align: center;
  box-shadow: 0 20px 80px rgba(85, 48, 71, 0.25);
}
.modalCard h3 { font-size: 24px; font-weight: 900; color: #a83232; margin: 0 0 10px; }
.modalCard p { font-size: 14px; line-height: 1.6; color: #76445e; margin: 0 0 24px; }
.actions { display: flex; gap: 12px; }
.actions button, .actions a {
  flex: 1; min-height: 48px; border-radius: 999px; font-weight: 800; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
  cursor: pointer;
}
.goBtn { background: #ffacd0; color: #61274c; border: 1px solid #e891b7; box-shadow: 0 3px 0 #e49bbb; }
.mapBtn { background: #fff9fc; color: #7f6287; border: 1px solid #e5d2e1; box-shadow: 0 3px 0 #ead7e4; }
</style>
</head>
<body>
  <div class="modalCard">
    <h3>Out of Moves!</h3>
    <p>You've used all your moves. Try a different path!</p>
    <div class="actions">
      <button class="goBtn">Try Again</button>
      <a href="/jelloo/map" class="mapBtn">Level Map</a>
    </div>
  </div>
</body>
</html>`;
}

// 3. Pressure Plate Switch and Door (inactive and active)
function generatePressurePlateHtml(active = false) {
  const switchIcon = "🔘";
  const gateIcon = active ? "🚪" : "🚪🔒";
  const switchBg = active ? "#ecfdf5" : "#fff9eb";
  const switchBorder = active ? "#10b981" : "#f59e0b";
  const doorBg = active ? "#f0fff6" : "#fffafd";
  const doorBorder = active ? "#63c998" : "#efdce6";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${gameCss}
body { margin: 0; padding: 24px; background: #fffaf3; font-family: "Trebuchet MS", system-ui, sans-serif; }
.demoContainer { max-width: 440px; margin: auto; text-align: center; }
.boardDemo { display: grid; grid-template-columns: repeat(3, 90px); gap: 8px; justify-content: center; margin: 20px auto; }
.demoCell {
  width: 90px; height: 90px; border-radius: 18px; position: relative;
  display: flex; align-items: center; justify-content: center; font-size: 28px;
  border: 2px solid #efdce6; background: #fffafd;
}
.plateCell { background: ${switchBg}; border-color: ${switchBorder}; }
.doorCell { background: ${doorBg}; border-color: ${doorBorder}; }
.label { font-size: 11px; font-weight: 800; position: absolute; bottom: 4px; color: #6d5779; }
.stateBadge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 13px; margin-bottom: 12px; }
.activeBadge { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.inactiveBadge { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
</style>
</head>
<body class="page compact">
  <div class="demoContainer">
    <h2>Pressure Plate & Linked Door</h2>
    <span class="stateBadge ${active ? 'activeBadge' : 'inactiveBadge'}">
      ${active ? 'PLATE PRESSED — DOOR UNLOCKED (STEPPED ON)' : 'INITIAL STATE — DOOR LOCKED'}
    </span>
    <div class="boardDemo">
      <div class="demoCell">🏁<span class="label">START</span></div>
      <div class="demoCell plateCell">${switchIcon}<span class="label">${active ? 'ACTIVATED' : 'PLATE'}</span></div>
      <div class="demoCell">↗️<span class="label">CORNER</span></div>
      <div class="demoCell">⬇️<span class="label">PATH</span></div>
      <div class="demoCell doorCell">${gateIcon}<span class="label">${active ? 'OPEN' : 'LOCKED'}</span></div>
      <div class="demoCell">🏡<span class="label">HOME</span></div>
    </div>
    <p style="font-size: 13px; color: #6a5371; line-height: 1.5;">
      ${active ? 'Pal steps onto the floor pressure plate 🔘. Linked door unlocks and opens! Pal passes safely to home.' : 'Initial board state: door 🚪🔒 is locked. Pal cannot reach home until stepping on the pressure plate 🔘.'}
    </p>
  </div>
</body>
</html>`;
}

// 4. Panda Trial Presentation HTML
function generatePandaTrialHtml() {
  const trial = playablePowerTrial("panda", 1);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${gameCss}
body { margin: 0; padding: 20px; background: #fffaf3; font-family: "Trebuchet MS", system-ui, sans-serif; }
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
    <section class="collection" style="margin-top: 14px;">
      <h2>Little pals. Big powers.</h2>
      <p>Master special abilities in dedicated Power Trials. Adventure levels feature specific pals automatically.</p>
      <div class="palCards">
        <button style="border-color: #bb7acf; background: #f0ddfa;">
          <span class="portrait"><span class="palSprite" data-character="panda"></span></span>
          <b>Panda</b><small>Play Trials</small>
        </button>
      </div>
      <p class="unlockProgress">26 adventure levels complete · 3/5 pals unlocked</p>
    </section>
    <nav class="trialTabs" style="margin: 12px 0;">
      <button style="background: #eadbfa; border-color: #ac7cca;">Trial 1<small>★★★</small></button>
      <button>Trial 2<small>★★★</small></button>
      <button>Trial 3<small>○ ○ ○</small></button>
    </nav>
    <div class="gamePanel">
      <div class="levelBar">
        <h2>Panda · <small>Power trial 1/3</small></h2>
        <span><b>0</b> moves · <small>Limit 6</small></span>
      </div>
      <div class="status">Break through cracked paths. They crumble behind Panda.</div>
    </div>
  </div>
</body>
</html>`;
}

// Write files and capture
const files = [
  { name: "map-level27-desktop.html", html: generateLevelMapHtml(26), out: "map-level27-desktop.png", w: 1280, h: 900 },
  { name: "map-level27-mobile-390.html", html: generateLevelMapHtml(26), out: "map-level27-mobile-390.png", w: 390, h: 844 },
  { name: "map-level27-mobile-320.html", html: generateLevelMapHtml(26), out: "map-level27-mobile-320.png", w: 320, h: 640 },
  { name: "out-of-moves-modal.html", html: generateOutOfMovesHtml(), out: "out-of-moves-modal.png", w: 420, h: 420 },
  { name: "pressure-plate-locked.html", html: generatePressurePlateHtml(false), out: "pressure-plate-locked.png", w: 500, h: 450 },
  { name: "pressure-plate-active.html", html: generatePressurePlateHtml(true), out: "pressure-plate-active.png", w: 500, h: 450 },
  { name: "panda-trial-view.html", html: generatePandaTrialHtml(), out: "panda-trial-view.png", w: 440, h: 720 },
];

for (const f of files) {
  const htmlPath = path.resolve(`docs/jelloo/phase8/${f.name}`);
  fs.writeFileSync(htmlPath, f.html);
  const outPath = path.resolve(`docs/jelloo/phase8/${f.out}`);
  const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${f.w},${f.h} --screenshot="${outPath}" "${fileUrl}"`;
  console.log(`Capturing ${f.out}...`);
  execSync(cmd, { stdio: "ignore" });
}

console.log("All Phase 8.1 visual acceptance screenshots generated!");
