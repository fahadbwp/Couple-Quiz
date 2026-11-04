/**
 * Daily Path (Pathle) - Offline Persistence & Streaks Engine
 * Milestone 4: Client-side storage with Web Locks & fail-safe synchronization
 */

import { isConsecutiveDay } from "./prng";
import type { DailyPathStats, MoveHistory } from "./types";

export type { DailyPathStats, MoveHistory };

export const DAILY_PATH_STORAGE_KEY = "playnudge.daily_path.v1";
export const DAILY_PATH_LOCK_NAME = "playnudge.daily_path.lock";

/**
 * Creates an empty zero-initialized DailyPathStats data structure.
 */
export function createInitialDailyPathStats(): DailyPathStats {
  return {
    currentStreak: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    moveDistribution: {},
    history: {},
    lastPlayedDate: null,
  };
}

/**
 * Sanitizes and validates arbitrary data to guarantee conforming DailyPathStats shape.
 * Recovers gracefully from corrupted, missing, or malformed fields.
 */
export function sanitizeStats(data: unknown): DailyPathStats {
  const fallback = createInitialDailyPathStats();
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const obj = data as Record<string, unknown>;

  const currentStreak =
    typeof obj.currentStreak === "number" && !isNaN(obj.currentStreak) && obj.currentStreak >= 0
      ? Math.floor(obj.currentStreak)
      : fallback.currentStreak;

  const maxStreak =
    typeof obj.maxStreak === "number" && !isNaN(obj.maxStreak) && obj.maxStreak >= 0
      ? Math.floor(obj.maxStreak)
      : Math.max(fallback.maxStreak, currentStreak);

  const gamesPlayed =
    typeof obj.gamesPlayed === "number" && !isNaN(obj.gamesPlayed) && obj.gamesPlayed >= 0
      ? Math.floor(obj.gamesPlayed)
      : fallback.gamesPlayed;

  const gamesWon =
    typeof obj.gamesWon === "number" && !isNaN(obj.gamesWon) && obj.gamesWon >= 0
      ? Math.floor(obj.gamesWon)
      : fallback.gamesWon;

  const moveDistribution: Record<number, number> = {};
  if (
    obj.moveDistribution &&
    typeof obj.moveDistribution === "object" &&
    !Array.isArray(obj.moveDistribution)
  ) {
    for (const [key, val] of Object.entries(obj.moveDistribution as Record<string, unknown>)) {
      const moveCount = Number(key);
      const freq = Number(val);
      if (!isNaN(moveCount) && !isNaN(freq) && moveCount > 0 && freq > 0) {
        moveDistribution[moveCount] = Math.floor(freq);
      }
    }
  }

  const history: Record<string, MoveHistory> = {};
  if (obj.history && typeof obj.history === "object" && !Array.isArray(obj.history)) {
    for (const [dateKey, item] of Object.entries(obj.history as Record<string, unknown>)) {
      if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        const dateStr = typeof itemObj.dateStr === "string" ? itemObj.dateStr : dateKey;
        const moves = typeof itemObj.moves === "number" && !isNaN(itemObj.moves) ? itemObj.moves : 0;
        const par = typeof itemObj.par === "number" && !isNaN(itemObj.par) ? itemObj.par : 0;
        const won = Boolean(itemObj.won);
        const completedAt =
          typeof itemObj.completedAt === "string" ? itemObj.completedAt : new Date().toISOString();
        history[dateKey] = {
          dateStr,
          moves,
          par,
          won,
          completedAt,
        };
      }
    }
  }

  const lastPlayedDate =
    typeof obj.lastPlayedDate === "string" && obj.lastPlayedDate.trim().length > 0
      ? obj.lastPlayedDate.trim()
      : null;

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    gamesPlayed: Math.max(gamesPlayed, gamesWon),
    gamesWon,
    moveDistribution,
    history,
    lastPlayedDate,
  };
}

// In-memory fallback dictionary for server-side environments or disabled local storage
const inMemoryStore = new Map<string, string>();

function getAvailableStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function readFromStorage(key: string): string | null {
  const storage = getAvailableStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return inMemoryStore.get(key) ?? null;
    }
  }
  return inMemoryStore.get(key) ?? null;
}

function writeToStorage(key: string, value: string): void {
  const storage = getAvailableStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      inMemoryStore.set(key, value);
      return;
    }
  }
  inMemoryStore.set(key, value);
}

function removeFromStorage(key: string): void {
  const storage = getAvailableStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore
    }
  }
  inMemoryStore.delete(key);
}

function readRawStats(): DailyPathStats {
  const raw = readFromStorage(DAILY_PATH_STORAGE_KEY);
  if (!raw) {
    return createInitialDailyPathStats();
  }
  try {
    const parsed = JSON.parse(raw);
    return sanitizeStats(parsed);
  } catch {
    return createInitialDailyPathStats();
  }
}

function writeRawStats(stats: DailyPathStats): void {
  writeToStorage(DAILY_PATH_STORAGE_KEY, JSON.stringify(stats));
}

// Concurrency mutex queue for environments without Web Locks API
let memoryLockQueue: Promise<unknown> = Promise.resolve();

/**
 * Executes an asynchronous or synchronous action inside a concurrency lock.
 * Uses `navigator.locks.request` when available in window/browser environment,
 * with safe sequential mutex fallback when `navigator.locks` is undefined.
 */
export async function withDailyPathLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const hasNavigatorLocks =
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function";

  if (hasNavigatorLocks) {
    return navigator.locks.request(DAILY_PATH_LOCK_NAME, async () => {
      return await fn();
    });
  }

  // Fallback sequential queue when navigator.locks is unavailable
  const prevLock = memoryLockQueue;
  let release: () => void = () => {};
  const currentLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  memoryLockQueue = currentLock;

  try {
    await prevLock.catch(() => {});
    return await fn();
  } finally {
    release();
  }
}

/**
 * Retrieves persisted Daily Path stats from storage.
 * Returns initialized zero-state if empty or corrupt.
 */
export async function getDailyPathStats(): Promise<DailyPathStats> {
  return withDailyPathLock(async () => {
    return readRawStats();
  });
}

/**
 * Records completion of the active daily challenge.
 * - Replay protection: if history[dateStr] is already completed, does NOT increment currentStreak or gamesWon.
 * - Consecutive day streak math:
 *   - If consecutive day -> currentStreak + 1, updates maxStreak.
 *   - If same day replay -> maintain currentStreak.
 *   - If gap > 1 day -> resets currentStreak to 1.
 * - Updates moveDistribution and lastPlayedDate.
 */
export async function saveDailyCompletion(
  dateStr: string,
  moves: number,
  par: number
): Promise<DailyPathStats> {
  return withDailyPathLock(async () => {
    const stats = readRawStats();
    const alreadyWon = Boolean(stats.history[dateStr]?.won);
    const isSameDay = stats.lastPlayedDate === dateStr;

    if (!alreadyWon && !isSameDay) {
      if (stats.lastPlayedDate && isConsecutiveDay(stats.lastPlayedDate, dateStr)) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.gamesPlayed += 1;
      stats.gamesWon += 1;
      stats.moveDistribution[moves] = (stats.moveDistribution[moves] || 0) + 1;
      stats.lastPlayedDate = dateStr;
    }

    stats.history[dateStr] = {
      dateStr,
      moves,
      par,
      won: true,
      completedAt: new Date().toISOString(),
    };

    writeRawStats(stats);
    return stats;
  });
}

/**
 * Records completion of a historical archive puzzle.
 * Saves replay completion in history[dateStr], but does NOT mutate active consecutive daily streak.
 */
export async function recordArchiveCompletion(
  dateStr: string,
  moves: number,
  par: number
): Promise<DailyPathStats> {
  return withDailyPathLock(async () => {
    const stats = readRawStats();

    stats.history[dateStr] = {
      dateStr,
      moves,
      par,
      won: true,
      completedAt: new Date().toISOString(),
    };

    writeRawStats(stats);
    return stats;
  });
}

/**
 * Clean hook for optional Supabase cloud leaderboard synchronization.
 * Fail-safe: if Supabase credentials are not configured or request fails, gracefully returns false without throwing.
 */
export async function syncWithSupabase(stats: DailyPathStats): Promise<boolean> {
  try {
    const url = (
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
      (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
      ""
    ).trim();

    const key = (
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) ||
      (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
      ""
    ).trim();

    if (!url || !key) {
      return false;
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from("daily_path_stats").upsert({
      current_streak: stats.currentStreak,
      max_streak: stats.maxStreak,
      games_played: stats.gamesPlayed,
      games_won: stats.gamesWon,
      move_distribution: stats.moveDistribution,
      last_played_date: stats.lastPlayedDate,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Clears stored stats from localStorage and memory fallback.
 */
export async function clearDailyPathStats(): Promise<void> {
  return withDailyPathLock(async () => {
    removeFromStorage(DAILY_PATH_STORAGE_KEY);
  });
}
