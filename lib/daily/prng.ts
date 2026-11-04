/**
 * Daily Path (Pathle) - Deterministic PRNG & Date Hashing
 * Numerical Recipes 32-bit LCG + 32-bit FNV-1a
 */

export const DAILY_PATH_VERSION = 1;
export const DAILY_PATH_EPOCH = "2026-01-01";

/**
 * 32-bit FNV-1a hash algorithm converting UTC date string into deterministic seed.
 * Produces identical unsigned 32-bit integer across all JS runtimes.
 */
export function seedFromUtcDate(dateStr: string, version: number = DAILY_PATH_VERSION): number {
  const input = `daily-path-v${version}-${dateStr}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export interface PrngInstance {
  seed: number;
  next(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
  nextChoice<T>(array: readonly T[]): T;
  shuffle<T>(array: readonly T[]): T[];
}

/**
 * Creates a deterministic Numerical Recipes 32-bit Linear Congruential Generator (LCG).
 * Formula: state = (state * 1664525 + 1013904223) >>> 0
 */
export function createPrng(initialSeed: number): PrngInstance {
  let state = initialSeed >>> 0;

  function next(): number {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }

  function nextInt(minInclusive: number, maxInclusive: number): number {
    const min = Math.ceil(minInclusive);
    const max = Math.floor(maxInclusive);
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextChoice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = Math.floor(next() * array.length);
    return array[idx];
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  return {
    get seed() {
      return state;
    },
    next,
    nextInt,
    nextChoice,
    shuffle,
  };
}

/**
 * Calculates 1-based puzzle number from UTC date string.
 * Default epoch is 2026-01-01 (Daily Path #1).
 */
export function getPuzzleNumber(dateStr: string, epoch: string = DAILY_PATH_EPOCH): number {
  const tDate = Date.parse(dateStr + "T00:00:00Z");
  const tEpoch = Date.parse(epoch + "T00:00:00Z");
  if (isNaN(tDate) || isNaN(tEpoch)) return 1;
  const diffDays = Math.floor((tDate - tEpoch) / (86400 * 1000));
  return Math.max(1, diffDays + 1);
}

/**
 * Returns current UTC date string formatted as "YYYY-MM-DD".
 */
export function currentUtcDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Checks whether two YYYY-MM-DD date strings are consecutive UTC calendar days.
 */
export function isConsecutiveDay(prevDateStr: string, nextDateStr: string): boolean {
  const t1 = Date.parse(prevDateStr + "T00:00:00Z");
  const t2 = Date.parse(nextDateStr + "T00:00:00Z");
  if (isNaN(t1) || isNaN(t2)) return false;
  const diffDays = Math.round((t2 - t1) / (86400 * 1000));
  return diffDays === 1;
}
