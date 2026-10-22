import test from "node:test";
import assert from "node:assert/strict";
import {
  formatShareCard,
  generateSpoilerFreeGrid,
  getJellooUrl,
  copyShareText,
  triggerNativeShare,
  type JellooShareInput,
} from "../lib/jelloo/share";

test("Share Cards: getJellooUrl returns absolute configured domain", () => {
  const url = getJellooUrl();
  assert.ok(url.startsWith("http"), "Must start with http/https");
  assert.ok(url.includes("/jelloo"), "Must contain /jelloo");
  assert.ok(!url.includes("localhost"), "Must not use localhost in production/canonical fallback");

  const dailyUrl = getJellooUrl("/jelloo/daily");
  assert.ok(dailyUrl.endsWith("/jelloo/daily"));
});

test("Share Cards: generateSpoilerFreeGrid hides tile kinds and rotations", () => {
  const path = [0, 1, 6, 11, 12];
  const grid = generateSpoilerFreeGrid(4, path);
  const lines = grid.split("\n");

  assert.equal(lines.length, 4, "Must have 4 rows for size 4");
  for (const line of lines) {
    // Each row must have 4 emoji blocks
    const chars = [...line];
    assert.equal(chars.length, 4, "Must have 4 columns per row");
    for (const c of chars) {
      assert.ok(c === "🟩" || c === "⬜", "Must only contain spoiler-free green or white squares");
    }
  }

  // Row 0 has index 0 (col 0) and index 1 (col 1) in path
  const row0 = [...lines[0]];
  assert.equal(row0[0], "🟩");
  assert.equal(row0[1], "🟩");
  assert.equal(row0[2], "⬜");
  assert.equal(row0[3], "⬜");

  // Does not leak rotation numbers or tile kind names
  assert.ok(!grid.includes("straight"));
  assert.ok(!grid.includes("corner"));
  assert.ok(!grid.includes("rotation"));
});

test("Share Cards: Daily share card uses genuine completed game state", () => {
  const input: JellooShareInput = {
    mode: "daily",
    levelId: -1,
    dailyDate: "2026-10-22",
    weekdayName: "Thursday",
    moves: 14,
    moveLimit: 18,
    stars: 3,
    collectedStars: 2,
    totalStars: 2,
    character: "panda",
    world: "beach",
    streak: 5,
    size: 5,
    path: [0, 1, 2, 7, 12, 17, 22, 23, 24],
  };

  const card = formatShareCard(input);

  // 1. Title contains date and world emoji
  assert.ok(card.title.includes("2026-10-22"));
  assert.ok(card.title.includes("🏖️"));

  // 2. Contains genuine moves and limit
  assert.ok(card.fullMessage.includes("14 moves (limit 18)"));

  // 3. Contains genuine stars
  assert.ok(card.fullMessage.includes("★★★"));

  // 4. Contains genuine streak
  assert.ok(card.fullMessage.includes("🔥 Streak: 5 days"));

  // 5. WhatsApp URL is properly encoded
  assert.ok(card.whatsappUrl.startsWith("https://api.whatsapp.com/send?text="));
  assert.ok(card.whatsappUrl.includes(encodeURIComponent("2026-10-22")));
  assert.ok(card.whatsappUrl.includes(encodeURIComponent("14 moves")));
});

test("Share Cards: Adventure share card uses genuine level, character, stars", () => {
  const input: JellooShareInput = {
    mode: "adventure",
    levelId: 42,
    moves: 9,
    moveLimit: 12,
    stars: 2,
    collectedStars: 1,
    totalStars: 2,
    character: "cat",
    world: "snow",
    size: 5,
    path: [5, 6, 7, 8, 13, 18],
  };

  const card = formatShareCard(input);

  // 1. Title contains Level 42 and snow emoji
  assert.ok(card.title.includes("Level 42"));
  assert.ok(card.title.includes("❄️"));

  // 2. Genuine moves and stars
  assert.ok(card.fullMessage.includes("9 moves (limit 12)"));
  assert.ok(card.fullMessage.includes("★★☆"));
  assert.ok(card.fullMessage.includes("🐱 Cat"));
  assert.ok(card.fullMessage.includes("1/2 collected"));

  // 3. Absolute URL
  assert.ok(card.fullMessage.includes("/jelloo"));
});

test("Share Cards: Clipboard and Native Share fallbacks handle missing APIs cleanly", async () => {
  // In Node test environment, navigator.clipboard is undefined
  const clipResult = await copyShareText("Test copy string");
  assert.ok(typeof clipResult.success === "boolean");

  const nativeResult = await triggerNativeShare({
    title: "Test",
    text: "Test body",
    url: "https://example.com",
  });
  assert.equal(nativeResult.supported, false, "Native share unsupported in Node environment");
  assert.equal(nativeResult.success, false);
});
