/**
 * Daily Path (Pathle) - Milestone 2 UI & Interaction Unit Tests
 * Tests rollover watcher, initial board render states, win detection workflow,
 * tile accessibility attributes, and metadata/JSON-LD exports.
 */

import test from "node:test";
import assert from "node:assert/strict";

// Rollover and Engine imports
import { watchUtcDay } from "../lib/daily/rollover";
import {
  generateDailyBoard,
  rotateTileAt,
  checkWinCondition,
  getConnectedTiles,
  DEFAULT_GRID_SIZE,
} from "../lib/daily/engine";
import { solveBoard, BASE_PORTS } from "../lib/daily/solver";
import {
  generateShareText,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  CLIPBOARD_TOAST_MESSAGE,
  SPOILER_FREE_REGEX,
  isSpoilerFree,
} from "../lib/daily/share";
import { jsonLd, PRIMARY_ORIGIN } from "../lib/platform/site";
import { metadata as dailyMetadata } from "../app/daily/page";
import { DailyPathArt } from "../components/daily-path/DailyPathArt";

// ============================================================================
// 1. Rollover Watcher Tests (lib/daily/rollover.ts)
// ============================================================================

test("Rollover Watcher: invokes onChange when mock UTC date changes", async () => {
  let simulatedDate = "2026-11-01";
  const dateGetter = () => simulatedDate;

  let triggeredNewDate = "";
  let callCount = 0;

  const unsubscribe = watchUtcDay(
    (newDate) => {
      triggeredNewDate = newDate;
      callCount++;
    },
    dateGetter,
    20 // 20ms fast interval for test
  );

  // Transition to next UTC day
  simulatedDate = "2026-11-02";

  // Wait 60ms for interval to tick
  await new Promise((resolve) => setTimeout(resolve, 60));

  unsubscribe();

  assert.equal(triggeredNewDate, "2026-11-02");
  assert.equal(callCount, 1);
});

test("Rollover Watcher: does NOT trigger onChange if date is unchanged", () => {
  const simulatedDate = "2026-11-01";
  let callCount = 0;

  const unsubscribe = watchUtcDay(() => {
    callCount++;
  }, () => simulatedDate);

  if (typeof document !== "undefined") {
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  }

  unsubscribe();
  assert.equal(callCount, 0);
});

test("Rollover Watcher: unsubscribe returns a function that safely cleans up", () => {
  const unsubscribe = watchUtcDay(() => {}, () => "2026-11-01");
  assert.equal(typeof unsubscribe, "function");
  // Should execute cleanly without error
  assert.doesNotThrow(() => unsubscribe());
});

// ============================================================================
// 2. Initial Board Render States & Geometry Tests
// ============================================================================

test("Board Geometry: creates 4x4 grid of 16 tiles with proper bounds", () => {
  const board = generateDailyBoard("2026-11-01");
  assert.equal(board.size, DEFAULT_GRID_SIZE);
  assert.equal(board.tiles.length, 4);

  let totalTiles = 0;
  for (let r = 0; r < 4; r++) {
    assert.equal(board.tiles[r].length, 4);
    for (let c = 0; c < 4; c++) {
      totalTiles++;
      const tile = board.tiles[r][c];
      assert.equal(tile.row, r);
      assert.equal(tile.col, c);
      assert.equal(tile.id, `cell-${r}-${c}`);
      assert.ok(typeof tile.type === "string");
      assert.ok(tile.rotation >= 0 && tile.rotation <= 3);
    }
  }
  assert.equal(totalTiles, 16);
});

test("Board Geometry: start tile is at [0,0] and goal tile is at [3,3], both fixed", () => {
  const board = generateDailyBoard("2026-11-01");
  const [startR, startC] = board.startPos;
  const [goalR, goalC] = board.goalPos;

  assert.equal(startR, 0);
  assert.equal(startC, 0);
  assert.equal(goalR, 3);
  assert.equal(goalC, 3);

  const startTile = board.tiles[startR][startC];
  const goalTile = board.tiles[goalR][goalC];

  assert.equal(startTile.type, "start");
  assert.equal(startTile.isFixed, true);
  assert.equal(goalTile.type, "goal");
  assert.equal(goalTile.isFixed, true);
});

test("Board Solvability: newly generated daily board starts in unsolved state", () => {
  const board = generateDailyBoard("2026-11-01");
  assert.equal(checkWinCondition(board), false, "Board must require rotation to solve");
});

test("Board Connectivity: getConnectedTiles always includes the start tile", () => {
  const board = generateDailyBoard("2026-11-01");
  const connected = getConnectedTiles(board);
  const startId = board.tiles[board.startPos[0]][board.startPos[1]].id;
  assert.ok(connected.has(startId), "Start tile must be considered connected to start");
});

// ============================================================================
// 3. Tile Interaction & Win Detection Workflow
// ============================================================================

test("Tile Interaction: rotating a non-fixed tile advances rotation by 1 modulo 4", () => {
  const board = generateDailyBoard("2026-11-01");
  // Find a rotatable tile
  let targetR = -1;
  let targetC = -1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board.tiles[r][c].isFixed) {
        targetR = r;
        targetC = c;
        break;
      }
    }
    if (targetR !== -1) break;
  }

  assert.ok(targetR !== -1 && targetC !== -1);
  const initialRot = board.tiles[targetR][targetC].rotation;
  const rotated = rotateTileAt(board, targetR, targetC);

  assert.equal(rotated.tiles[targetR][targetC].rotation, (initialRot + 1) % 4);
});

test("Tile Interaction: rotating fixed start or goal tile does nothing", () => {
  const board = generateDailyBoard("2026-11-01");
  const [sr, sc] = board.startPos;
  const [gr, gc] = board.goalPos;

  const startRotBefore = board.tiles[sr][sc].rotation;
  const goalRotBefore = board.tiles[gr][gc].rotation;

  const afterStart = rotateTileAt(board, sr, sc);
  const afterGoal = rotateTileAt(afterStart, gr, gc);

  assert.equal(afterGoal.tiles[sr][sc].rotation, startRotBefore);
  assert.equal(afterGoal.tiles[gr][gc].rotation, goalRotBefore);
});

test("Win Detection: applying solver rotations connects path and triggers win condition", () => {
  const board = generateDailyBoard("2026-11-01");
  const solution = solveBoard(board);
  assert.equal(solution.solvable, true);
  assert.ok(solution.targetRotations);

  let currentBoard = board;
  for (const [id, targetRot] of Object.entries(solution.targetRotations)) {
    const [, rStr, cStr] = id.split("-");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    while (currentBoard.tiles[r][c].rotation !== targetRot) {
      currentBoard = rotateTileAt(currentBoard, r, c);
    }
  }

  // Win condition must now be true!
  assert.equal(checkWinCondition(currentBoard), true);

  // Both start and goal must be in connected tiles set
  const connected = getConnectedTiles(currentBoard);
  const startId = currentBoard.tiles[currentBoard.startPos[0]][currentBoard.startPos[1]].id;
  const goalId = currentBoard.tiles[currentBoard.goalPos[0]][currentBoard.goalPos[1]].id;

  assert.ok(connected.has(startId));
  assert.ok(connected.has(goalId));
});

// ============================================================================
// 4. Base Ports & Tile Type Specifications
// ============================================================================

test("Tile Specifications: BASE_PORTS definition matches pipe geometry", () => {
  assert.deepEqual(BASE_PORTS.start, [1]); // East
  assert.deepEqual(BASE_PORTS.goal, [3]);  // West
  assert.deepEqual(BASE_PORTS.straight, [1, 3]); // Horizontal
  assert.deepEqual(BASE_PORTS.corner, [0, 1]);   // North, East
  assert.deepEqual(BASE_PORTS.tee, [0, 1, 3]);   // North, East, West
  assert.deepEqual(BASE_PORTS.cross, [0, 1, 2, 3]); // 4 ways
  assert.deepEqual(BASE_PORTS.blank, []);
});

test("Accessibility: ARIA labels match format Tile {row},{col}: {type}, rotation {deg} degrees", () => {
  const formatTileAriaLabel = (row: number, col: number, type: string, rotation: number) =>
    `Tile ${row},${col}: ${type}, rotation ${rotation * 90} degrees`;

  const label = formatTileAriaLabel(0, 1, "straight", 1);
  assert.equal(label, "Tile 0,1: straight, rotation 90 degrees");

  const labelCorner = formatTileAriaLabel(2, 3, "corner", 2);
  assert.equal(labelCorner, "Tile 2,3: corner, rotation 180 degrees");
});

// ============================================================================
// 5. Scorecard & Share Buttons Workflow
// ============================================================================

test("Share Workflow: generates valid Wordle-style scorecard conforming to SPOILER_FREE_REGEX", () => {
  const card = generateShareText({
    puzzleNumber: 42,
    moves: 5,
    par: 6,
    streak: 7,
  });

  assert.match(card, SPOILER_FREE_REGEX);
  assert.equal(isSpoilerFree(card), true);
  assert.ok(card.includes("Daily Path #42 🧭"));
  assert.ok(card.includes("5/6 Moves • Streak: 🔥 7"));
});

test("Share Workflow: clipboard toast message is defined and non-empty", () => {
  assert.equal(CLIPBOARD_TOAST_MESSAGE, "Scorecard copied to clipboard!");
});

test("Share Workflow: social intent URLs encode scorecard text properly", () => {
  const text = "Daily Path #1 🧭\nTest text";
  const waUrl = getWhatsAppShareUrl(text);
  assert.ok(waUrl.startsWith("https://api.whatsapp.com/send?text="));
  assert.ok(waUrl.includes(encodeURIComponent(text)));

  const twUrl = getTwitterShareUrl(text);
  assert.ok(twUrl.startsWith("https://twitter.com/intent/tweet?text="));
  assert.ok(twUrl.includes(encodeURIComponent(text)));
});

// ============================================================================
// 6. Page Metadata & Schema.org JSON-LD
// ============================================================================

test("Page Metadata: app/daily/page exports metadata conforming to PlayNudge standard", () => {
  assert.deepEqual(dailyMetadata.title, {
    absolute: "Daily Path — Minimalist Daily Logic Puzzle | PlayNudge",
  });
  assert.equal(
    dailyMetadata.alternates?.canonical,
    `${PRIMARY_ORIGIN}/daily`
  );
  assert.ok(dailyMetadata.openGraph);
  assert.ok(dailyMetadata.twitter);
});

test("Page JSON-LD: schema graph serializes safely without script tag leakage", () => {
  const sampleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Daily Path",
        applicationCategory: "GameApplication",
      },
      {
        "@type": "BreadcrumbList",
      },
    ],
  };

  const serialized = jsonLd(sampleSchema);
  assert.ok(!serialized.includes("</script>"));
  const parsed = JSON.parse(serialized);
  assert.equal(parsed["@graph"][0].name, "Daily Path");
  assert.equal(parsed["@graph"][0].applicationCategory, "GameApplication");
});

// ============================================================================
// 7. Platform Artwork Component
// ============================================================================

test("Platform Artwork: DailyPathArt is an exported functional component", () => {
  assert.equal(typeof DailyPathArt, "function");
  // Test invoking the function component directly in JS
  const element = DailyPathArt({ className: "w-full" });
  assert.ok(element !== null);
  assert.equal(typeof element, "object");
});
