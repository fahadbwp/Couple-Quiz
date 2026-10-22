import { getBaseUrl } from "../quiz/sharing";
import type { Character } from "./engine";
import type { WorldId } from "./worlds";

export interface JellooShareInput {
  mode: "daily" | "adventure";
  levelId: number;
  dailyDate?: string;
  weekdayName?: string;
  moves: number;
  moveLimit?: number;
  stars: number;
  collectedStars: number;
  totalStars: number;
  character: Character;
  world: WorldId;
  streak?: number;
  size: number;
  path: number[];
  url?: string;
}

export interface ShareCardResult {
  title: string;
  text: string;
  url: string;
  fullMessage: string;
  whatsappUrl: string;
}

const WORLD_EMOJIS: Record<WorldId, string> = {
  meadow: "🌿",
  beach: "🏖️",
  snow: "❄️",
  candy: "🍭",
  space: "🚀",
};

const CHARACTER_NAMES: Record<Character, string> = {
  bunny: "🐰 Bunny",
  panda: "🐼 Panda",
  cat: "🐱 Cat",
  octopus: "🐙 Octopus",
  fox: "🦊 Fox",
};

export function getJellooUrl(path: string = "/jelloo"): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function generateSpoilerFreeGrid(size: number, path: number[]): string {
  if (!size || size < 2 || !Array.isArray(path) || !path.length) {
    return "🟩".repeat(3);
  }

  const pathSet = new Set(path);
  const rows: string[] = [];

  for (let r = 0; r < size; r++) {
    let rowStr = "";
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (pathSet.has(idx)) {
        rowStr += "🟩";
      } else {
        rowStr += "⬜";
      }
    }
    rows.push(rowStr);
  }

  return rows.join("\n");
}

export function formatShareCard(input: JellooShareInput): ShareCardResult {
  const starDisplay = "★".repeat(Math.max(0, Math.min(3, input.stars))) + "☆".repeat(Math.max(0, 3 - input.stars));
  const worldEmoji = WORLD_EMOJIS[input.world] || "🌿";
  const charDisplay = CHARACTER_NAMES[input.character] || "🐰 Bunny";
  const targetUrl = input.url || getJellooUrl(input.mode === "daily" ? "/jelloo/daily" : "/jelloo");
  const grid = generateSpoilerFreeGrid(input.size, input.path);

  let title = "";
  const lines: string[] = [];

  if (input.mode === "daily") {
    title = `Jelloo Daily · ${input.dailyDate || "Today"} ${worldEmoji}`;
    lines.push(title);
    const moveStr = input.moveLimit !== undefined
      ? `${input.moves} moves (limit ${input.moveLimit})`
      : `${input.moves} moves`;
    lines.push(`${starDisplay} · ${moveStr}`);
    if (typeof input.streak === "number" && input.streak > 0) {
      lines.push(`🔥 Streak: ${input.streak} day${input.streak === 1 ? "" : "s"}`);
    }
  } else {
    title = `Jelloo Adventure · Level ${input.levelId} ${worldEmoji}`;
    lines.push(title);
    const moveStr = input.moveLimit !== undefined
      ? `${input.moves} moves (limit ${input.moveLimit})`
      : `${input.moves} moves`;
    lines.push(`${starDisplay} · ${moveStr} · ${charDisplay}`);
    lines.push(`Stars: ${input.collectedStars}/${input.totalStars} collected`);
  }

  lines.push("");
  lines.push(grid);
  lines.push("");
  lines.push(`Play Jelloo: ${targetUrl}`);

  const fullMessage = lines.join("\n");
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;

  return {
    title,
    text: lines.slice(0, -2).join("\n"),
    url: targetUrl,
    fullMessage,
    whatsappUrl,
  };
}

export async function copyShareText(text: string): Promise<{ success: boolean; error?: string }> {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch {
      // Fallback below
    }
  }

  // Fallback for older browsers or restricted iframe contexts
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copied) return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  return { success: false, error: "Clipboard API unavailable" };
}

export async function triggerNativeShare(data: { title: string; text: string; url: string }): Promise<{
  success: boolean;
  supported: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return { success: true, supported: true };
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { success: false, supported: true, cancelled: true };
      }
      return { success: false, supported: true, error: (err as Error).message };
    }
  }
  return { success: false, supported: false };
}
