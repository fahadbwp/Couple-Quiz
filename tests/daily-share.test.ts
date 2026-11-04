/**
 * Tests for Daily Path (Pathle) - Viral Share Card & Intents Engine
 * Milestone 3: lib/daily/share.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  generateShareText,
  formatWordleShareCard,
  computeEfficiencyEmojis,
  isSpoilerFree,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  copyToClipboard,
  triggerNativeShare,
  SPOILER_FREE_REGEX,
  SPOILER_FREE_GENERAL_REGEX,
  CLIPBOARD_TOAST_MESSAGE,
} from "../lib/daily/share";
import { PRIMARY_ORIGIN } from "../lib/platform/site";

// ============================================================================
// 1. Share Card Formatting & Generation
// ============================================================================

test("M3-Share-1.1: generateShareText formats standard Wordle-style card exactly", () => {
  const card = generateShareText({
    puzzleNumber: 42,
    moves: 5,
    par: 6,
    streak: 7,
  });

  const lines = card.split("\n");
  assert.equal(lines.length, 5);
  assert.equal(lines[0], "Daily Path #42 🧭");
  assert.equal(lines[1], "5/6 Moves • Streak: 🔥 7");
  assert.match(lines[2], /^[🟩🟨⬜]{4}$/u);
  assert.match(lines[3], /^[🟩🟨⬜]{4}$/u);
  assert.equal(lines[4], "https://playnudge.netlify.app/daily");
});

test("M3-Share-1.2: formatWordleShareCard alias produces identical output", () => {
  const data = { puzzleNumber: 42, moves: 5, par: 6, streak: 7 };
  assert.equal(formatWordleShareCard(data), generateShareText(data));
});

test("M3-Share-1.3: generateShareText uses custom efficiencyGrid when provided", () => {
  const customGrid = "🟩🟩🟩🟩\n🟩🟩🟩🟩";
  const card = generateShareText({
    puzzleNumber: 10,
    moves: 4,
    par: 4,
    streak: 1,
    efficiencyGrid: customGrid,
  });

  assert.ok(card.includes(customGrid));
  assert.match(card, /^Daily Path #10 🧭\n4\/4 Moves • Streak: 🔥 1\n🟩🟩🟩🟩\n🟩🟩🟩🟩\n/);
});

test("M3-Share-1.4: generateShareText handles custom origin without trailing slash duplication", () => {
  const cardTrailing = generateShareText({
    puzzleNumber: 42,
    moves: 5,
    par: 6,
    streak: 7,
    origin: "https://custom.playnudge.com/",
  });
  assert.ok(cardTrailing.endsWith("https://custom.playnudge.com/daily"));
  assert.ok(!cardTrailing.includes("//daily"));

  const cardNoTrailing = generateShareText({
    puzzleNumber: 42,
    moves: 5,
    par: 6,
    streak: 7,
    origin: "https://custom.playnudge.com",
  });
  assert.ok(cardNoTrailing.endsWith("https://custom.playnudge.com/daily"));
});

test("M3-Share-1.5: generateShareText handles zero streak and high move counts", () => {
  const zeroStreakCard = generateShareText({
    puzzleNumber: 1,
    moves: 24,
    par: 6,
    streak: 0,
  });
  assert.match(zeroStreakCard, /24\/6 Moves • Streak: 🔥 0/);
  assert.equal(isSpoilerFree(zeroStreakCard), true);

  const highStreakCard = generateShareText({
    puzzleNumber: 150,
    moves: 6,
    par: 6,
    streak: 99,
  });
  assert.match(highStreakCard, /6\/6 Moves • Streak: 🔥 99/);
  assert.equal(isSpoilerFree(highStreakCard), true);
});

// ============================================================================
// 2. Emoji Efficiency Grid Computation
// ============================================================================

test("M3-Share-2.1: computeEfficiencyEmojis returns strict 4x2 grid of allowed emojis", () => {
  const grid = computeEfficiencyEmojis(5, 6);
  const rows = grid.split("\n");
  assert.equal(rows.length, 2);
  assert.match(rows[0], /^[🟩🟨⬜]{4}$/u);
  assert.match(rows[1], /^[🟩🟨⬜]{4}$/u);
});

test("M3-Share-2.2: computeEfficiencyEmojis produces all 🟩 for perfect par play", () => {
  const grid = computeEfficiencyEmojis(6, 6);
  assert.equal(grid, "🟩🟩🟩🟩\n🟩🟩🟩🟩");
});

test("M3-Share-2.3: computeEfficiencyEmojis produces canonical iconic pattern for 5/6 moves", () => {
  const grid = computeEfficiencyEmojis(5, 6);
  assert.equal(grid, "🟩🟨⬜🟩\n🟩🟩🟩🟩");
});

test("M3-Share-2.4: computeEfficiencyEmojis contains ⬜ (buffer) when beating par", () => {
  const grid = computeEfficiencyEmojis(3, 8);
  assert.ok(grid.includes("⬜"), "Should include white buffer block for unused par");
  assert.ok(grid.includes("🟩"), "Should include green blocks for solved segments");
});

test("M3-Share-2.5: computeEfficiencyEmojis contains 🟨 (adjustments) when exceeding par", () => {
  const grid = computeEfficiencyEmojis(14, 6);
  assert.ok(grid.includes("🟨"), "Should include yellow blocks for extra adjustments");
  assert.ok(!grid.includes("⬜"), "Should have zero unused buffer when exceeding par");
});

test("M3-Share-2.6: computeEfficiencyEmojis respects explicit efficiencyScore parameter", () => {
  const perfectScoreGrid = computeEfficiencyEmojis(6, 6, 1.0);
  assert.equal(perfectScoreGrid, "🟩🟩🟩🟩\n🟩🟩🟩🟩");

  const partialScoreGrid = computeEfficiencyEmojis(8, 6, 0.5);
  assert.ok(partialScoreGrid.includes("🟨"));
  assert.ok(partialScoreGrid.includes("🟩"));

  const percentageScoreGrid = computeEfficiencyEmojis(6, 6, 100);
  assert.equal(percentageScoreGrid, "🟩🟩🟩🟩\n🟩🟩🟩🟩");
});

test("M3-Share-2.7: computeEfficiencyEmojis handles boundary values safely without crashing", () => {
  assert.doesNotThrow(() => computeEfficiencyEmojis(0, 0));
  assert.doesNotThrow(() => computeEfficiencyEmojis(-5, -2));
  assert.doesNotThrow(() => computeEfficiencyEmojis(1000, 4));

  const zeroGrid = computeEfficiencyEmojis(0, 0);
  const rows = zeroGrid.split("\n");
  assert.equal(rows.length, 2);
  assert.match(rows[0], /^[🟩🟨⬜]{4}$/u);
  assert.match(rows[1], /^[🟩🟨⬜]{4}$/u);
});

// ============================================================================
// 3. Anti-Spoiler Invariant & Regex Validation (isSpoilerFree)
// ============================================================================

test("M3-Share-3.1: isSpoilerFree validates all standard generated cards as true", () => {
  const testCases = [
    { puzzleNumber: 1, moves: 4, par: 6, streak: 0 },
    { puzzleNumber: 42, moves: 5, par: 6, streak: 7 },
    { puzzleNumber: 90, moves: 6, par: 6, streak: 90 }, // Day 90 / streak 90
    { puzzleNumber: 180, moves: 8, par: 6, streak: 12 }, // Day 180
    { puzzleNumber: 270, moves: 12, par: 8, streak: 3 }, // Day 270
    { puzzleNumber: 365, moves: 5, par: 5, streak: 365 },
  ];

  for (const tc of testCases) {
    const card = generateShareText(tc);
    assert.equal(
      isSpoilerFree(card),
      true,
      `Failed on puzzle #${tc.puzzleNumber}`
    );
  }
});

test("M3-Share-3.2: isSpoilerFree rejects scorecard leaking tile types", () => {
  const baseCard = generateShareText({ puzzleNumber: 42, moves: 5, par: 6, streak: 7 });

  assert.equal(isSpoilerFree(baseCard + " straight"), false);
  assert.equal(isSpoilerFree(baseCard + " corner"), false);
  assert.equal(isSpoilerFree(baseCard + " tee"), false);
  assert.equal(isSpoilerFree(baseCard + " cross"), false);
  assert.equal(isSpoilerFree(baseCard + " start"), false);
  assert.equal(isSpoilerFree(baseCard + " goal"), false);
  assert.equal(isSpoilerFree(baseCard + " blank"), false);
});

test("M3-Share-3.3: isSpoilerFree rejects scorecard leaking coordinates", () => {
  const baseCard = generateShareText({ puzzleNumber: 42, moves: 5, par: 6, streak: 7 });

  assert.equal(isSpoilerFree(baseCard + " (r0c1)"), false);
  assert.equal(isSpoilerFree(baseCard + " r1c2"), false);
  assert.equal(isSpoilerFree(baseCard + " row: 1"), false);
  assert.equal(isSpoilerFree(baseCard + " col: 2"), false);
  assert.equal(isSpoilerFree(baseCard + " cell-1-2"), false);
  assert.equal(isSpoilerFree(baseCard + " (1, 2)"), false);
  assert.equal(isSpoilerFree(baseCard + " [0, 1]"), false);
  assert.equal(isSpoilerFree(baseCard + " {2, 3}"), false);
});

test("M3-Share-3.4: isSpoilerFree rejects scorecard leaking rotation angles or keywords", () => {
  const baseCard = generateShareText({ puzzleNumber: 42, moves: 5, par: 6, streak: 7 });

  assert.equal(isSpoilerFree(baseCard + " rot: 2"), false);
  assert.equal(isSpoilerFree(baseCard + " rotation=1"), false);
  assert.equal(isSpoilerFree(baseCard + " 90deg"), false);
  assert.equal(isSpoilerFree(baseCard + " 180°"), false);
  assert.equal(isSpoilerFree(baseCard + " 270 degrees"), false);
  assert.equal(isSpoilerFree(baseCard + " rotate 90"), false);
});

test("M3-Share-3.5: isSpoilerFree rejects structural anomalies or invalid formatting", () => {
  // Missing compass emoji
  const noCompass = "Daily Path #42\n5/6 Moves • Streak: 🔥 7\n🟩🟨⬜🟩\n🟩🟩🟩🟩\nhttps://playnudge.netlify.app/daily";
  assert.equal(isSpoilerFree(noCompass), false);

  // Missing streak flame
  const noFlame = "Daily Path #42 🧭\n5/6 Moves • Streak: 7\n🟩🟨⬜🟩\n🟩🟩🟩🟩\nhttps://playnudge.netlify.app/daily";
  assert.equal(isSpoilerFree(noFlame), false);

  // Grid line with only 3 emojis
  const shortGrid = "Daily Path #42 🧭\n5/6 Moves • Streak: 🔥 7\n🟩🟨⬜\n🟩🟩🟩🟩\nhttps://playnudge.netlify.app/daily";
  assert.equal(isSpoilerFree(shortGrid), false);

  // Grid line with 5 emojis
  const longGrid = "Daily Path #42 🧭\n5/6 Moves • Streak: 🔥 7\n🟩🟨⬜🟩🟩\n🟩🟩🟩🟩\nhttps://playnudge.netlify.app/daily";
  assert.equal(isSpoilerFree(longGrid), false);

  // Invalid URL ending
  const badUrl = "Daily Path #42 🧭\n5/6 Moves • Streak: 🔥 7\n🟩🟨⬜🟩\n🟩🟩🟩🟩\nhttps://playnudge.netlify.app/other";
  assert.equal(isSpoilerFree(badUrl), false);

  // Non-string inputs
  assert.equal(isSpoilerFree(null as unknown as string), false);
  assert.equal(isSpoilerFree(undefined as unknown as string), false);
  assert.equal(isSpoilerFree(12345 as unknown as string), false);
});

// ============================================================================
// 4. Social Sharing Intents & Clipboard Copy
// ============================================================================

test("M3-Share-4.1: getWhatsAppShareUrl generates valid WhatsApp intent URL with encoded payload", () => {
  const card = generateShareText({ puzzleNumber: 42, moves: 5, par: 6, streak: 7 });
  const waUrl = getWhatsAppShareUrl(card);

  assert.match(waUrl, /^https:\/\/api\.whatsapp\.com\/send\?text=/);
  const param = waUrl.replace("https://api.whatsapp.com/send?text=", "");
  assert.equal(decodeURIComponent(param), card);
  assert.ok(param.includes("%0A")); // Newline
  assert.ok(param.includes(encodeURIComponent("🧭")));
  assert.ok(param.includes(encodeURIComponent("🔥")));
  assert.ok(!param.includes("#")); // Hash must be percent-encoded
});

test("M3-Share-4.2: getTwitterShareUrl generates valid Twitter / X intent URL", () => {
  const card = generateShareText({ puzzleNumber: 42, moves: 5, par: 6, streak: 7 });
  const twitterUrl = getTwitterShareUrl(card);

  assert.match(twitterUrl, /^https:\/\/twitter\.com\/intent\/tweet\?text=/);
  const param = twitterUrl.replace("https://twitter.com/intent/tweet?text=", "");
  assert.equal(decodeURIComponent(param), card);
});

test("M3-Share-4.3: copyToClipboard returns false gracefully in non-DOM/SSR environment", async () => {
  // In Node.js environment without window/document, copyToClipboard resolves false without throwing
  const result = await copyToClipboard("test");
  assert.equal(typeof result, "boolean");
  assert.equal(result, false);
});

test("M3-Share-4.4: copyToClipboard uses navigator.clipboard.writeText when available", async () => {
  let copiedText = "";
  const originalWindow = globalThis.window;
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  try {
    globalThis.window = { isSecureContext: true } as unknown as Window & typeof globalThis;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          writeText: async (text: string) => {
            copiedText = text;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    const success = await copyToClipboard("Daily Path Scorecard");
    assert.equal(success, true);
    assert.equal(copiedText, "Daily Path Scorecard");
  } finally {
    globalThis.window = originalWindow;
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
  }
});

test("M3-Share-4.5: copyToClipboard falls back to DOM textarea execCommand when clipboard API fails", async () => {
  const originalWindow = globalThis.window;
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalDocument = globalThis.document;

  let execCommandCalled = false;
  let appendedValue = "";

  try {
    globalThis.window = { isSecureContext: false } as unknown as Window & typeof globalThis;
    Object.defineProperty(globalThis, "navigator", {
      value: { clipboard: undefined },
      configurable: true,
      writable: true,
    });
    globalThis.document = {
      createElement: () => {
        const el: Record<string, unknown> = {
          style: {},
          setAttribute: () => {},
          focus: () => {},
          select: () => {},
        };
        Object.defineProperty(el, "value", {
          set(v) {
            appendedValue = v;
          },
        });
        return el as unknown as HTMLElement;
      },
      body: {
        appendChild: <T extends Node>(node: T): T => node,
        removeChild: <T extends Node>(child: T): T => child,
      } as unknown as HTMLElement,
      execCommand: (cmd: string) => {
        if (cmd === "copy") {
          execCommandCalled = true;
          return true;
        }
        return false;
      },
    } as unknown as Document;

    const success = await copyToClipboard("Fallback Scorecard");
    assert.equal(success, true);
    assert.equal(execCommandCalled, true);
    assert.equal(appendedValue, "Fallback Scorecard");
  } finally {
    globalThis.window = originalWindow;
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
    globalThis.document = originalDocument;
  }
});

test("M3-Share-4.6: triggerNativeShare handles supported, dismissed, and unsupported states", async () => {
  // 1. Unsupported (Node.js) -> returns false
  const unsuppResult = await triggerNativeShare("Title", "Text", "https://url.com");
  assert.equal(unsuppResult, false);

  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    // 2. Supported and user shares
    let sharedPayload: Record<string, string> | null = null;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        share: async (data: Record<string, string>) => {
          sharedPayload = data;
        },
      },
      configurable: true,
      writable: true,
    });

    const success = await triggerNativeShare("Daily Path #42", "Scorecard", "https://playnudge.netlify.app/daily");
    assert.equal(success, true);
    assert.deepEqual(sharedPayload, {
      title: "Daily Path #42",
      text: "Scorecard",
      url: "https://playnudge.netlify.app/daily",
    });

    // 3. Supported but user cancels (share rejects with AbortError)
    Object.defineProperty(globalThis, "navigator", {
      value: {
        share: async () => {
          const err = new Error("Share canceled");
          err.name = "AbortError";
          throw err;
        },
      },
      configurable: true,
      writable: true,
    });

    const canceled = await triggerNativeShare("Title", "Text", "https://url.com");
    assert.equal(canceled, false);
  } finally {
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
  }
});

test("M3-Share-4.7: Exported constants and invariants match project contracts", () => {
  assert.equal(CLIPBOARD_TOAST_MESSAGE, "Scorecard copied to clipboard!");
  assert.ok(SPOILER_FREE_REGEX instanceof RegExp);
  assert.ok(SPOILER_FREE_GENERAL_REGEX instanceof RegExp);

  // Canonical share card matches SPOILER_FREE_REGEX
  const canonicalCard = generateShareText({
    puzzleNumber: 42,
    moves: 5,
    par: 6,
    streak: 7,
  });
  assert.ok(SPOILER_FREE_REGEX.test(canonicalCard));
  assert.ok(SPOILER_FREE_GENERAL_REGEX.test(canonicalCard));
});
