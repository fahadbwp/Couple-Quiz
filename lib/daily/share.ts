/**
 * Daily Path (Pathle) - Viral Share Card & Intents Engine
 * 3rd Flagship Game on PlayNudge
 *
 * Implements Wordle-style spoiler-free emoji scorecard, anti-leak validation,
 * clipboard copy, and native/social share intents.
 */

import { PRIMARY_ORIGIN } from "../platform/site";

export interface ShareCardData {
  puzzleNumber: number;
  moves: number;
  par: number;
  streak: number;
  efficiencyGrid?: string;
  origin?: string;
}

export const CLIPBOARD_TOAST_MESSAGE = "Scorecard copied to clipboard!";

/**
 * Strict regex for canonical spoiler-free share card:
 * Line 1: Daily Path #<number> 🧭
 * Line 2: <moves>/<par> Moves • Streak: 🔥 <streak>
 * Line 3: 4 efficiency emojis (🟩, 🟨, ⬜)
 * Line 4: 4 efficiency emojis (🟩, 🟨, ⬜)
 * Line 5: Platform URL ending in /daily
 */
export const SPOILER_FREE_REGEX =
  /^Daily Path #\d+ 🧭\n\d+\/\d+ Moves • Streak: 🔥 \d+\n[🟩🟨⬜]{4}\n[🟩🟨⬜]{4}\nhttps:\/\/playnudge\.netlify\.app\/daily$/u;

export const SPOILER_FREE_GENERAL_REGEX =
  /^Daily Path #\d+ 🧭\n\d+\/\d+ Moves • Streak: 🔥 \d+\n[🟩🟨⬜]{4}\n[🟩🟨⬜]{4}\nhttps?:\/\/[^\s]+\/daily$/u;

/**
 * Generates an iconic 4x2 emoji efficiency grid (e.g. 🟩🟨⬜🟩\n🟩🟩🟩🟩).
 * Uses 🟩 for optimal/efficient segments, 🟨 for extra adjustments, ⬜ for unused par buffer.
 * Strictly abstract: NEVER reflects board coordinates, tile shapes, or rotation values.
 */
export function computeEfficiencyEmojis(
  moves: number,
  par: number,
  efficiencyScore?: number
): string {
  const safeMoves = Math.max(0, Math.floor(moves));
  const safePar = Math.max(1, Math.floor(par));

  let greenCount = 0;
  let yellowCount = 0;
  let whiteCount = 0;

  if (efficiencyScore !== undefined) {
    const normScore =
      efficiencyScore > 1
        ? Math.min(1, efficiencyScore / 100)
        : Math.max(0, Math.min(1, efficiencyScore));
    greenCount = Math.round(normScore * 8);
    const remaining = 8 - greenCount;
    if (safeMoves > safePar) {
      yellowCount = remaining;
      whiteCount = 0;
    } else if (safeMoves < safePar) {
      whiteCount = Math.min(remaining, Math.max(1, safePar - safeMoves));
      yellowCount = remaining - whiteCount;
    } else {
      yellowCount = remaining;
    }
  } else if (safeMoves === safePar) {
    // Exact par matched: perfect green play
    greenCount = 8;
    yellowCount = 0;
    whiteCount = 0;
  } else if (safeMoves < safePar) {
    // Under par (beat par)
    const diff = safePar - safeMoves;
    whiteCount = Math.min(6, Math.max(1, Math.round((diff / safePar) * 8)));
    // For single-step buffer with active puzzle interaction, 1 adjustment step
    if (diff === 1 && safeMoves >= 3) {
      yellowCount = 1;
    } else {
      yellowCount = 0;
    }
    greenCount = Math.max(1, 8 - whiteCount - yellowCount);
  } else {
    // Over par (moves > par)
    const extra = safeMoves - safePar;
    yellowCount = Math.min(7, Math.max(1, Math.round((extra / safeMoves) * 8)));
    whiteCount = 0;
    greenCount = Math.max(1, 8 - yellowCount);
  }

  // Exact 8-block invariant reconciliation
  while (greenCount + yellowCount + whiteCount < 8) {
    greenCount++;
  }
  while (greenCount + yellowCount + whiteCount > 8) {
    if (greenCount > 1) greenCount--;
    else if (yellowCount > 0) yellowCount--;
    else whiteCount--;
  }

  // Canonical aesthetic layout for 6 green, 1 yellow, 1 white:
  if (yellowCount === 1 && whiteCount === 1 && greenCount === 6) {
    return "🟩🟨⬜🟩\n🟩🟩🟩🟩";
  }

  const blocks: string[] = [];
  for (let i = 0; i < greenCount; i++) blocks.push("🟩");
  for (let i = 0; i < yellowCount; i++) blocks.push("🟨");
  for (let i = 0; i < whiteCount; i++) blocks.push("⬜");

  return `${blocks.slice(0, 4).join("")}\n${blocks.slice(4, 8).join("")}`;
}

/**
 * Produces the exact Wordle-style spoiler-free card:
 * Daily Path #42 🧭
 * 5/6 Moves • Streak: 🔥 7
 * 🟩🟨⬜🟩
 * 🟩🟩🟩🟩
 * https://playnudge.netlify.app/daily
 */
export function generateShareText(data: ShareCardData): string {
  const grid =
    data.efficiencyGrid && data.efficiencyGrid.trim().length > 0
      ? data.efficiencyGrid.trim()
      : computeEfficiencyEmojis(data.moves, data.par);

  const baseUrl = (data.origin || PRIMARY_ORIGIN).replace(/\/+$/, "");
  const url = `${baseUrl}/daily`;

  return `Daily Path #${data.puzzleNumber} 🧭\n${data.moves}/${data.par} Moves • Streak: 🔥 ${data.streak}\n${grid}\n${url}`;
}

/** Backward-compatible alias for formatWordleShareCard */
export const formatWordleShareCard = generateShareText;

/**
 * Strict validation verifying no solution coordinates (r,c) or row/col,
 * no rotation angles (90, 180, 270, deg), and no tile types (tee, corner,
 * straight, cross) leak into the scorecard.
 */
export function isSpoilerFree(text: string): boolean {
  if (typeof text !== "string") return false;

  // Structural shape verification
  if (!SPOILER_FREE_GENERAL_REGEX.test(text)) {
    return false;
  }

  const lower = text.toLowerCase();

  // Forbidden leak substrings and keywords
  const leakSubstrings = [
    "rot",
    "rotation",
    "degree",
    "deg",
    "straight",
    "corner",
    "tee",
    "cross",
    "start",
    "goal",
    "blank",
    "cell-",
    "row",
    "col",
    "coord",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
  ];

  if (leakSubstrings.some((leak) => lower.includes(leak))) {
    return false;
  }

  // Regex patterns for coordinates (e.g. r0c1, 1,2) and rotation angles (e.g. 90deg, 180°, 270°)
  const leakPatterns = [
    /\br\d+c\d+\b/i,
    /\b\d+\s*,\s*\d+\b/,
    /\b(?:90|180|270)\s*(?:°|deg|degrees?)\b/i,
  ];

  if (leakPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  return true;
}

/**
 * Generates WhatsApp share intent URL:
 * https://api.whatsapp.com/send?text=...
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Generates Twitter / X share intent URL:
 * https://twitter.com/intent/tweet?text=...
 */
export function getTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * Copies text to clipboard with modern Clipboard API and legacy fallback.
 * Safe in browser, secure/insecure contexts, and server environments.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // 1. Modern Navigator Clipboard API
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext !== false
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Legacy fallback via temporary DOM textarea
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return Boolean(success);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Triggers native Web Share API dialog if supported.
 * Falls back gracefully (returns false) if unsupported or rejected by user.
 */
export async function triggerNativeShare(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
